// Looking to send emails in production? Check out our Email API/SMTP product!

import { MailtrapClient } from 'mailtrap';
import dotenv from 'dotenv';

dotenv.config();

const MAILTRAP_TOKEN = process.env.MAILTRAP_TOKEN;

export const mailtrapClient = new MailtrapClient({
	token: MAILTRAP_TOKEN,
	testInboxId: 3422844,
	accountId: 264790,
});

export const sender = {
	email: 'hello@example.com',
	name: 'Elmir Auth App',
};
