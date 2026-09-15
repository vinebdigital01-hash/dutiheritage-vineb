with open("src/lib/email.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_interface = """export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type?: "auth" | "orders" | "marketing";
}): Promise<SendEmailResult> {"""

new_interface = """export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  type?: "auth" | "orders" | "marketing";
  attachments?: { filename: string; content: string }[];
}): Promise<SendEmailResult> {"""

content = content.replace(old_interface, new_interface)

old_body = """      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),"""

new_body = """      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html: input.html,
        text: input.text,
        attachments: input.attachments,
      }),"""
      
content = content.replace(old_body, new_body)

with open("src/lib/email.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated email.ts with attachments support")
