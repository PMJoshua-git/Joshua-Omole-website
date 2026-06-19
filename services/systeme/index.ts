// Systeme.io API wrapper
export const addContactToSysteme = async (email: string, firstName?: string, tagId?: string) => {
  const apiKey = process.env.SYSTEME_API_KEY;
  if (!apiKey) return null;

  try {
    const url = "https://api.systeme.io/api/contacts";

    const payload = {
      email,
      fields: [] as any[]
    };

    if (firstName) {
      // Assuming a custom field for first name if needed, or there might be standard mapping.
      // Often in Systeme, standard fields are added through the 'fields' array or direct if supported.
      // E.g. {"fields": [ { "slug": "first_name", "value": firstName } ] }
      payload.fields.push({ slug: "first_name", value: firstName });
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
