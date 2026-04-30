import braintree from "braintree";
import dotenv from "dotenv";
dotenv.config();

const gateway = new braintree.BraintreeGateway({
  environment:
    process.env.BRAINTREE_ENVIRONMENT === "sandbox"
      ? braintree.Environment.Sandbox
      : braintree.Environment.Production,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

export default gateway;
