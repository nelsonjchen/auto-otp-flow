// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe('Hello World worker', () => {
	it('responds with Hello World! (unit style)', async () => {
		const request = new IncomingRequest('http://example.com');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it('responds with Hello World! (integration style)', async () => {
		const response = await SELF.fetch('https://example.com');
		expect(await response.text()).toMatchInlineSnapshot(`"Hello World!"`);
	});

	it('emails', async () => {
		const ctx = createExecutionContext();
		const content = "Hello World!";

		// Step 2: Convert the string to Uint8Array
		const uint8ArrayContent = new TextEncoder().encode(content);

		// Step 3: Create the ReadableStream
		const readableStream = new ReadableStream<Uint8Array>({
		start(controller) {
			controller.enqueue(uint8ArrayContent);
			controller.close(); // Close the stream after enqueueing the content
		}
		});

		const response = await worker.email(
			{
				from: 'lol@lol.com',
				to: 'inbox@corp',
				raw: readableStream,
				headers: {
					'Content-Type': 'text/plain',
				},
				setReject: (reason: string) => {
					// Do nothing
				},
				forward: async (to: string) => {
					// Do nothing
				},
			} as any,
			env,
			ctx
		);
	});
});
