import { getAccessToken } from './auth';

const SITE_ID = import.meta.env.VITE_SHAREPOINT_SITE_ID ?? '';
const FOLDER_PATH = import.meta.env.VITE_SHAREPOINT_FOLDER_PATH ?? 'Auction Photos';

export async function uploadZipToSharePoint(filename: string, zipBlob: Blob): Promise<void> {
  const token = await getAccessToken();

  const createSessionResp = await fetch(
    `https://graph.microsoft.com/v1.0/sites/${SITE_ID}/drive/root:/${FOLDER_PATH}/${filename}:/createUploadSession`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': 'rename' } }),
    }
  );

  if (!createSessionResp.ok) {
    throw new Error(`Failed to create upload session: ${createSessionResp.status}`);
  }

  const { uploadUrl } = await createSessionResp.json();
  const size = zipBlob.size;

  const uploadResp = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Length': String(size),
      'Content-Range': `bytes 0-${size - 1}/${size}`,
    },
    body: zipBlob,
  });

  if (!uploadResp.ok) {
    throw new Error(`Upload failed: ${uploadResp.status}`);
  }
}
