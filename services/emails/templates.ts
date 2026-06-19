export const getResourceEmailTemplate = (firstName: string, resourceTitle: string, resourceLink: string) => {
  const customMessage = "I hope this resource brings value to your business.";
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #1a365d;">Your Requested Resource Is Ready</h2>
      <p>Hi ${firstName},</p>
      <p>Thank you for requesting <strong>${resourceTitle}</strong>.</p>
      <p>${customMessage}</p>
      <div style="margin: 30px 0;">
        <a href="${resourceLink}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Download Resource</a>
      </div>
      <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
      <p><a href="${resourceLink}">${resourceLink}</a></p>
      <br />
      <p>Best regards,</p>
      <p><strong>Joshua Omole</strong><br/>AI Integration Specialist & IT Project Manager</p>
    </div>
  `;

  const text = `
    Your Requested Resource Is Ready

    Hi ${firstName},

    Thank you for requesting ${resourceTitle}.
    ${customMessage}

    Download your resource here:
    ${resourceLink}

    Best regards,
    Joshua Omole
    AI Integration Specialist & IT Project Manager
  `;

  return { html, text };
};

export const getConsultationConfirmationTemplate = (firstName: string, serviceName: string) => {
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #1a365d;">Consultation Request Received</h2>
      <p>Hi ${firstName},</p>
      <p>Thank you for reaching out regarding <strong>${serviceName}</strong>.</p>
      <p>I have received your inquiry and look forward to speaking with you. If you haven't already, please secure a time on my calendar using the link provided after you submitted the form.</p>
      <br />
      <p>Best regards,</p>
      <p><strong>Joshua Omole</strong></p>
    </div>
  `;
  
  const text = `
    Consultation Request Received
    
    Hi ${firstName},
    Thank you for reaching out regarding ${serviceName}.
    I have received your inquiry and look forward to speaking with you.
    
    Best regards,
    Joshua Omole
  `;

  return { html, text };
};
