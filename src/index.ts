/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Bind resources to your worker in `wrangler.toml`. After adding bindings, a type definition for the
 * `Env` object can be regenerated with `npm run cf-typegen`.
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export default {
	async fetch(request, env, ctx): Promise<Response> {
		return new Response('Hello World!');
	},
	async email(message, env, ctx) {
		// Store the email in the KV namespace
		await env.AUTO_OTP_FLOW_KV.put(
			'email:' + message.to,
			JSON.stringify({
				from: message.from,
				raw: message.raw,
				headers: message.headers,
				rawSize: message.rawSize,
			})
		);
	}
} satisfies ExportedHandler<Env>;
