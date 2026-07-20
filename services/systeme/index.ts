// Systeme.io API wrapper
export const addContactToSysteme = async (
  email: string, 
  firstName?: string, 
  tagId?: string,
  additionalData?: {
    lastName?: string;
    position?: string;
    company?: string;
    country?: string;
    companySize?: string;
  }
) => {
  const apiKey = process.env.SYSTEME_API_KEY;
  if (!apiKey) return null;

  try {
    const url = "https://api.systeme.io/api/contacts";

    const payload = {
      email,
      fields: [] as any[]
    };

    if (firstName) {
      payload.fields.push({ slug: "first_name", value: firstName });
    }
    if (additionalData?.lastName) {
      payload.fields.push({ slug: "surname", value: additionalData.lastName });
    }
    if (additionalData?.company) {
      payload.fields.push({ slug: "company_name", value: additionalData.company });
    }
    if (additionalData?.country) {
      payload.fields.push({ slug: "country", value: additionalData.country });
    }
    if (additionalData?.position) {
      payload.fields.push({ slug: "position", value: additionalData.position });
    }
    if (additionalData?.companySize) {
      payload.fields.push({ slug: "company_size", value: additionalData.companySize });
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      console.error('Systeme Add Contact Error:', await res.text());
      return null;
    }

    const data = await res.json();
    const contactId = data.id || (data.contact && data.contact.id);

    if (contactId && tagId) {
       await addTagToSystemeContact(contactId, tagId, apiKey);
    }

    return data;
  } catch (error) {
    console.error('Systeme Add Contact Exception:', error);
    return null;
  }
};

const addTagToSystemeContact = async (contactId: string | number, tagId: string, apiKey: string) => {
   try {
      const url = `https://api.systeme.io/api/contacts/${contactId}/tags`;
      const res = await fetch(url, {
         method: 'POST',
         headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-API-Key': apiKey
         },
         body: JSON.stringify({ tag_id: parseInt(tagId, 10) })
      });

      if (!res.ok) {
         console.error('Systeme Add Tag Error:', await res.text());
      }
   } catch (error) {
      console.error('Systeme Add Tag Exception:', error);
   }
};
