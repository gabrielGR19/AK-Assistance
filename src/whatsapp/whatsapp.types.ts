export interface WhatsAppTextMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text";
  text: { body: string };
}

export interface WhatsAppTemplateMessage {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "template";
  template: {
    name: string;
    language: { code: string };
    components?: WhatsAppTemplateComponent[];
  };
}

export interface WhatsAppTemplateComponent {
  type: "body" | "header" | "button";
  parameters: { type: "text"; text: string }[];
}

export interface CallSummaryData {
  customerName?: string;
  customerPhone: string;
  summary: string;
  appointmentRequested: boolean;
  appointmentDate?: string;
  craftworkerPhone: string;
}
