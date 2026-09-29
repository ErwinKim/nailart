import { randomUUID } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const maxDuration = 300;

const MODEL = 'gemini-3-pro-image-preview';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

const extensionByMimeType: Record<string, string> = {
	'image/png': 'png',
	'image/jpeg': 'jpg',
	'image/webp': 'webp',
	'image/gif': 'gif',
};

type GeminiImagePart = {
	inlineData?: { data?: string; mimeType?: string };
	inline_data?: { data?: string; mime_type?: string };
};

type GeminiResponse = {
	candidates?: Array<{ content?: { parts?: GeminiImagePart[] } }>;
	promptFeedback?: { blockReason?: string };
	error?: { message?: string };
};

function jsonError(message: string, status: number) {
	return Response.json({ error: message }, { status });
}

async function markFailed(supabase: Awaited<ReturnType<typeof createClient>>, id: string) {
	await supabase.from('thumbnails').update({ status: 'failed', image_path: null }).eq('id', id);
}

export async function POST(request: Request) {
	const supabase = await createClient();
	const { data: { user }, error: authError } = await supabase.auth.getUser();

	if (authError || !user) return jsonError('Sign in to generate a thumbnail.', 401);

	const apiKey = process.env.GEMINI_API_KEY;
	if (!apiKey) return jsonError('GEMINI_API_KEY is not configured on the server.', 500);

	const contentLength = Number(request.headers.get('content-length') || 0);
	if (contentLength > MAX_IMAGE_BYTES + 128 * 1024) {
		return jsonError('Reference images must be 10 MB or smaller.', 413);
	}

	let formData: FormData;
	let uploadedImagePath: string | null = null;
	try {
		formData = await request.formData();
	} catch {
		return jsonError('The prompt request could not be read.', 400);
	}

	const prompt = String(formData.get('prompt') || '').trim();
	if (!prompt) return jsonError('Describe the thumbnail you want to create.', 400);
	if (prompt.length > 4000) return jsonError('Prompts must be 4,000 characters or fewer.', 400);

	const reference = formData.get('reference');
	if (reference && !(reference instanceof File)) {
		return jsonError('The reference image is invalid.', 400);
	}
	if (reference instanceof File) {
		if (!ALLOWED_IMAGE_TYPES.has(reference.type)) {
			return jsonError('Use a PNG, JPEG, WebP, or GIF reference image.', 415);
		}
		if (reference.size > MAX_IMAGE_BYTES) {
			return jsonError('Reference images must be 10 MB or smaller.', 413);
		}
	}

	const { data: thumbnail, error: insertError } = await supabase
		.from('thumbnails')
		.insert({
			user_id: user.id,
			prompt,
			status: 'processing',
			metadata: {
				model: MODEL,
				aspect_ratio: '16:9',
				image_size: '1K',
			},
		})
		.select('id')
		.single();

	if (insertError || !thumbnail) {
		return jsonError('Could not create a thumbnail record. Please try again.', 500);
	}

	try {
		const parts: Array<Record<string, unknown>> = [
			{
				text: `Create a polished, high-impact YouTube thumbnail in a 16:9 widescreen composition. Make the subject immediately recognizable, use a strong focal point, deliberate visual hierarchy, and bold readable contrast. Follow this creative brief: ${prompt}`,
			},
		];

		if (reference instanceof File) {
			const imageData = Buffer.from(await reference.arrayBuffer()).toString('base64');
			parts.push({ inlineData: { mimeType: reference.type, data: imageData } });
		}

		const geminiResponse = await fetch(
			`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-goog-api-key': apiKey,
				},
				body: JSON.stringify({
					contents: [{ role: 'user', parts }],
					generationConfig: {
						responseModalities: ['IMAGE'],
						imageConfig: { aspectRatio: '16:9', imageSize: '1K' },
					},
				}),
				signal: AbortSignal.timeout(240_000),
			},
		);

		const geminiData = await geminiResponse.json() as GeminiResponse;
		if (!geminiResponse.ok) {
			const detail = geminiData.error?.message?.slice(0, 400);
			throw new Error(detail || `Gemini returned HTTP ${geminiResponse.status}.`);
		}

		const imagePart = geminiData.candidates
			?.flatMap((candidate) => candidate.content?.parts ?? [])
			.find((part) => part.inlineData?.data || part.inline_data?.data);
		const imageData = imagePart?.inlineData?.data ?? imagePart?.inline_data?.data;
		const mimeType = imagePart?.inlineData?.mimeType ?? imagePart?.inline_data?.mime_type ?? 'image/png';

		if (!imageData) {
			const blockReason = geminiData.promptFeedback?.blockReason;
			throw new Error(blockReason ? `Gemini blocked this prompt (${blockReason}).` : 'Gemini returned no image. Try changing your prompt.');
		}
		if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
			throw new Error(`Gemini returned an unsupported image type: ${mimeType}.`);
		}

		const imageBuffer = Buffer.from(imageData, 'base64');
		if (imageBuffer.byteLength === 0 || imageBuffer.byteLength > MAX_IMAGE_BYTES) {
			throw new Error('The generated image exceeded the 10 MB storage limit.');
		}

		const imagePath = `${user.id}/${thumbnail.id}-${randomUUID()}.${extensionByMimeType[mimeType]}`;
		const { error: uploadError } = await supabase.storage
			.from('image')
			.upload(imagePath, imageBuffer, { contentType: mimeType, upsert: false });

		if (uploadError) throw new Error(`Could not save the generated image: ${uploadError.message}`);
		uploadedImagePath = imagePath;

		const { error: updateError } = await supabase
			.from('thumbnails')
			.update({
				image_path: imagePath,
				status: 'completed',
				metadata: {
					model: MODEL,
					aspect_ratio: '16:9',
					image_size: '1K',
					mime_type: mimeType,
				},
			})
			.eq('id', thumbnail.id);

		if (updateError) {
			await supabase.storage.from('image').remove([imagePath]);
			throw new Error(`Could not save the thumbnail record: ${updateError.message}`);
		}

		const { data: signedImage, error: signedUrlError } = await supabase.storage
			.from('image')
			.createSignedUrl(imagePath, 60 * 60);

		if (signedUrlError || !signedImage) {
			throw new Error('The thumbnail was saved, but its preview could not be opened.');
		}

		return Response.json({
			thumbnail: {
				id: thumbnail.id,
				prompt,
				imagePath,
				imageUrl: signedImage.signedUrl,
				mimeType,
			},
		});
	} catch (error) {
		if (uploadedImagePath) await supabase.storage.from('image').remove([uploadedImagePath]);
		await markFailed(supabase, thumbnail.id);
		const message = error instanceof Error ? error.message : 'Image generation failed. Please try again.';
		return jsonError(message, 502);
	}
}
