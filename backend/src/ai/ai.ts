import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

export interface ChatMessage {
	role: 'system' | 'user' | 'assistant';
	content: string;
}

@Injectable()
export class AiProvider {
	private client: OpenAI;

	constructor() {
		this.client = new OpenAI({
			baseURL: 'http://localhost:11434/v1',
			apiKey: 'ollama',
		});
	}

	async chat(messages: ChatMessage[]) {
		const response = await this.client.chat.completions.create({
			model: 'gemma3:4b-cloud',
			messages: messages.map((msg) => ({
				role: msg.role,
				content: msg.content,
			})),
		});
		return response.choices[0].message.content;
	}

	async *stream(messages: ChatMessage[]) {
		const response = await this.client.chat.completions.create({
			model: 'gemma3:4b-cloud',
			messages: messages.map((msg) => ({
				role: msg.role,
				content: msg.content,
			})),
			stream: true,
		});

		for await (const part of response) {
			const content = part.choices[0].delta?.content ?? '';
			yield content;
		}
	}

	public parseJSONResponse(text: string) {
		// Strategy 1: Try direct parse first — cheapest path for clean responses.
		try {
			return JSON.parse(text);
		} catch (_) {
			/* fall through */
		}

		// Strategy 2: Strip markdown fences: ```json ... ``` or ``` ... ```
		const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
		if (fenceMatch) {
			try {
				return JSON.parse(fenceMatch[1].trim());
			} catch (_) {
				/* fall through */
			}
		}

		// Strategy 3: Try to find first { ... } or [ ... ] block
		// Handles cases where the model prefixes/suffixes the JSON with explanation text.
		const objMatch = text.match(/\{[\s\S]*\}/);
		if (objMatch) {
			try {
				return JSON.parse(objMatch[0]);
			} catch (_) {
				/* fall through */
			}
		}

		// Strategy 4: Try to find a top-level JSON array if no object was found.
		const arrMatch = text.match(/\[[\s\S]*\]/);
		if (arrMatch) {
			try {
				return JSON.parse(arrMatch[0]);
			} catch (_) {
				/* fall through */
			}
		}

		// All strategies exhausted — the response cannot be parsed as JSON.
		throw new Error('Could not parse JSON from AI response');
	}
}
