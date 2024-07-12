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

		class Email {
			from: string;
			to: string;
			raw: ReadableStream<Uint8Array>;
			headers: Headers;
			isSent: boolean;
			rawSize: number;
			rejectReason: string | undefined;
			forwarded_to: string | undefined;

			constructor(from: string, to: string, raw: ReadableStream<Uint8Array>, headers: Record<string, string>) {
			  this.from = from;
			  this.to = to;
			  this.raw = raw;
			  this.rawSize = 0; // Initially, the raw size is 0
			  this.headers = new Headers(headers);
			  this.isSent = false; // Initially, the email is not sent
			  this.rejectReason = undefined; // No rejection reason initially
			}

			// Simulate sending the email
			send() {
			  // Implement sending logic here
			  // For example, you might check if `to` address is valid, then set `isSent` accordingly
			  if (this.to.includes('@')) {
				this.isSent = true;
			  } else {
				this.setReject('Invalid recipient address');
			  }
			}

			// Set the rejection reason
			setReject(reason: string) {
			  this.rejectReason = reason;
			  this.isSent = false; // Ensure isSent is false if rejected
			}

			async forward(to: string) {
			  this.forwarded_to = to;
			}
		  }

		  // Usage
		  const email = new Email('lol@lol.com', 'inbox@corp', readableStream, {
			'Content-Type': 'text/plain',
		  });


		const response = await worker.email(
			email,
			env,
			ctx
		);
	});
});
