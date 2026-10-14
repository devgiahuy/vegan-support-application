# Research — 2026-10-13

- VNPAY sandbox registration asks for site, email, password and CAPTCHA; keys arrive by email. No account registration performed by the agent. Sources: https://sandbox.vnpayment.vn/devreg/ and https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html.
- VNPAY checkout/IPN uses sorted form-encoded HMAC-SHA512; amounts multiply integer VND by 100. Querydr uses a different pipe-separated request/response signature. Verify every provider response before settlement.
- payOS has no separate sandbox; MoMo production has onboarding/UAT; select VNPAY for external sandbox.
- Mongo callback transactions retry entire database operations. Shared user-document writes serialize credit/capacity races. New referenced models require referenceVersion. Use the existing schema provisioning tool.
- Existing scan retry reprocesses all images and discards prior candidates. Charge one bounded job once, with configured attempt cap, rather than introducing per-image billing and changing candidate semantics. This is an intentional refinement of the earlier analysis.
- Use existing daily free chat quota plus purchased credits; keep their counters separate.
