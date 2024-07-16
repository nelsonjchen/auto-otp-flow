# 📬 Auto OTP Flow

This is a simple Cloudflare Workers service to take incoming email, store it into a KV store temporaily, and permit retrieval of the email with a query. It is to be used for retrieving [One-time password](https://en.wikipedia.org/wiki/One-time_password) calls.

## Usage

It is an alternative to Mailinator's service that you can use cheaply and re-host should you desire for privacy reasons.

A public version of this is hosted at `470079.xyz`.

`.xyz` domains more than 6 numbers long are cheap at a dollar a year and relatively short. A top-level domain is necessary to use the catch-all email functionality of Cloudflare Workers.

Additionally, it's kind of scary to send to it because it is strange and numeric right? If you care about privacy, you can host this yourself too. It also reminds you that you can do that.

You can email any email address at `470079.xyz` and retrieve the email with a secret key being the secret and made-up email address you sent the email to. Use forwarding rules in your email client or service to do so.

Setup your mail client or service to selectively forward the OTP email(s) to your secret target email address. The email will be stored for half an hour.

Visit the endpoint `https://470079.xyz/r/<secret_email_address_here_including_domain_name>` to see the list of emails stored in the KV store for that email address. You will get a JSON response with all the emails stored.

It is up to you to parse the JSON, handle sorting, and parse the emails to get the OTP or other information you need. The body is minimallly parsed for ease of debugging so handle that on your end.
