'use client';

import type { ChangeEvent, FormEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Image from 'next/image';

type Tool = {
	id: string;
	name: string;
	shortName: string;
	icon: string;
};

type GeneratedThumbnail = {
	id: string;
	prompt: string;
	imagePath: string;
	imageUrl: string;
	mimeType: string;
};

const tools: Tool[] = [
	{ id: 'create-image', name: 'Create an image', shortName: 'Image', icon: '✦' },
	{ id: 'search-web', name: 'Search the web', shortName: 'Search', icon: '◎' },
	{ id: 'write-code', name: 'Write or code', shortName: 'Write', icon: '⌁' },
	{ id: 'deep-research', name: 'Run deep research', shortName: 'Deep Search', icon: '◌' },
	{ id: 'think-longer', name: 'Think for longer', shortName: 'Think', icon: '◐' },
];

function PlusIcon() {
	return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>;
}

function SettingsIcon() {
	return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7h-9M14 17H5M17 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM7 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>;
}

function MicIcon() {
	return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3ZM19 11v1a7 7 0 0 1-14 0v-1M12 19v3M9 22h6" /></svg>;
}

function SendIcon() {
	return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 14-7-4 14-3-6-7-1ZM12 13l7-8" /></svg>;
}

function CloseIcon() {
	return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>;
}

export default function PromptArea() {
	const [prompt, setPrompt] = useState('');
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const [referenceImage, setReferenceImage] = useState<File | null>(null);
	const [generatedThumbnail, setGeneratedThumbnail] = useState<GeneratedThumbnail | null>(null);
	const [isGenerating, setIsGenerating] = useState(false);
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
	const [toolsOpen, setToolsOpen] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		return () => {
			if (imagePreview?.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
		};
	}, [imagePreview]);

	useLayoutEffect(() => {
		const textarea = textareaRef.current;
		if (!textarea) return;
		textarea.style.height = 'auto';
		textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
	}, [prompt]);

	const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0];
		if (file) {
			if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
				setGenerationError('Use a PNG, JPEG, WebP, or GIF reference image.');
			} else if (file.size > 10 * 1024 * 1024) {
				setGenerationError('Reference images must be 10 MB or smaller.');
			} else {
				setGenerationError(null);
				setReferenceImage(file);
				setImagePreview(URL.createObjectURL(file));
			}
		}
		event.target.value = '';
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		if (!prompt.trim() || isGenerating) return;

		setIsGenerating(true);
		setGenerationError(null);
		setGeneratedThumbnail(null);

		try {
			const formData = new FormData();
			formData.set('prompt', prompt.trim());
			if (referenceImage) formData.set('reference', referenceImage);

			const response = await fetch('/api/thumbnails', { method: 'POST', body: formData });
			const result = await response.json() as { error?: string; thumbnail?: GeneratedThumbnail };
			if (!response.ok || !result.thumbnail) {
				throw new Error(result.error || 'Thumbnail generation failed. Please try again.');
			}

			setGeneratedThumbnail(result.thumbnail);
		} catch (error) {
			setGenerationError(error instanceof Error ? error.message : 'Thumbnail generation failed. Please try again.');
		} finally {
			setIsGenerating(false);
		}
	};

	return (
		<section className="prompt-area" aria-label="Thumbnail prompt">
			<h1 className="prompt-greeting">Describe your Thumbnail</h1>
			{generatedThumbnail ? (
				<figure className="generated-thumbnail">
					<Image src={generatedThumbnail.imageUrl} alt="AI-generated YouTube thumbnail" width={1376} height={774} unoptimized />
					<figcaption>
						<span>Nano Banana Pro <i aria-hidden="true" /> Saved to your studio</span>
						<a href={generatedThumbnail.imageUrl} target="_blank" rel="noreferrer">Open image <span aria-hidden="true">↗</span></a>
					</figcaption>
				</figure>
			) : null}
			{isGenerating ? <p className="prompt-generation-status" role="status">Creating your thumbnail with Nano Banana Pro...</p> : null}
			{generationError ? <p className="prompt-generation-error" role="alert">{generationError}</p> : null}
			<form className="prompt-box" onSubmit={handleSubmit}>
				<input ref={fileInputRef} className="prompt-file-input" type="file" accept="image/*" onChange={handleFileChange} />
				{imagePreview ? (
					<div className="prompt-image-preview">
						<Image src={imagePreview} alt="Selected reference" width={58} height={58} unoptimized />
						<button type="button" onClick={() => { setImagePreview(null); setReferenceImage(null); }} aria-label="Remove image"><CloseIcon /></button>
					</div>
				) : null}
				<textarea
					ref={textareaRef}
					rows={1}
					value={prompt}
					onChange={(event) => setPrompt(event.target.value)}
					placeholder="Message..."
					aria-label="Thumbnail prompt"
				/>
				<div className="prompt-toolbar">
					<div className="prompt-toolbar-left">
						<button className="prompt-icon-button" type="button" onClick={() => fileInputRef.current?.click()} title="Attach image" aria-label="Attach image"><PlusIcon /></button>
						<div className="prompt-tools-wrap">
							<button className="prompt-tools-button" type="button" onClick={() => setToolsOpen((open) => !open)} aria-expanded={toolsOpen}>
								<SettingsIcon />
								{selectedTool ? selectedTool.shortName : 'Tools'}
							</button>
							{toolsOpen ? (
								<div className="prompt-tools-menu">
									{tools.map((tool) => (
										<button type="button" key={tool.id} onClick={() => { setSelectedTool(tool); setToolsOpen(false); }}>
											<span>{tool.icon}</span>{tool.name}
										</button>
									))}
								</div>
							) : null}
						</div>
						{selectedTool ? <button className="prompt-selected-tool" type="button" onClick={() => setSelectedTool(null)}>{selectedTool.shortName}<CloseIcon /></button> : null}
					</div>
					<div className="prompt-toolbar-right">
						<button className="prompt-icon-button" type="button" title="Record voice" aria-label="Record voice"><MicIcon /></button>
						<button className="prompt-send-button" type="submit" disabled={!prompt.trim() || isGenerating} title="Generate thumbnail" aria-label="Generate thumbnail" aria-busy={isGenerating}>
							{isGenerating ? <span className="prompt-send-spinner" aria-hidden="true" /> : <SendIcon />}
						</button>
					</div>
				</div>
			</form>
		</section>
	);
}
