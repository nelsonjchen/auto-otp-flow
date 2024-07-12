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

	it('handles emails, stores them, and makes them retrievable', async () => {
		const ctx = createExecutionContext();
		class MockEmail {
			from: string;
			to: string;
			raw: ReadableStream<Uint8Array>;
			headers: Headers;
			rawSize: number;
			rejectReason: string | undefined;
			forwarded_to: string | undefined;

			constructor(from: string, to: string, rawBodyText: string, headers: Record<string, string>) {
				this.from = from;
				this.to = to;
				const uint8ArrayContent = new TextEncoder().encode(rawBodyText);
				const readableStream = new ReadableStream<Uint8Array>({
					start(controller) {
						controller.enqueue(uint8ArrayContent);
						controller.close(); // Close the stream after enqueueing the content
					}
				});
				this.raw = readableStream;
				this.rawSize = uint8ArrayContent.length;
				this.headers = new Headers(headers);
				this.rejectReason = undefined; // No rejection reason initially
			}

			// Simulate sending the email
			send() {
				// This service has no sending, do not test.
			}

			setReject(reason: string) {
				this.rejectReason = reason;
			}

			async forward(to: string) {
				// This service has no forwarding, do not test.
			}
		}

		// Usage
		const secret_email_key = 'secret_email_key@service.example';

		const email = new MockEmail(
			'service_user@example.com',
			secret_email_key,
			"Hi, I'm a test email! The OTP is 123456.",
			{ "Content-Type": "text/plain" });

		await worker.email(
			email,
			env,
			ctx
		);

		// Check if the KV store has the email (TODO: Use implementation-specific methods to check for the email in the KV store)
		const storedEmailsList = await env.AUTO_OTP_FLOW_KV.list({
			prefix: 'email:' + secret_email_key,
		});
		console.log(storedEmailsList);
		expect(storedEmailsList.keys).toHaveLength(1);
		// Look at the stored email
		const storedEmail = await env.AUTO_OTP_FLOW_KV.get('email:' + secret_email_key);
		console.log(storedEmail);

	});
});
