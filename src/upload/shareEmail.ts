export function canShareFiles(files: File[]): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files });
}

export async function shareZipViaEmail(filename: string, zipBlob: Blob): Promise<void> {
  const file = new File([zipBlob], filename, { type: 'application/zip' });

  if (!canShareFiles([file])) {
    throw new Error('SHARE_NOT_SUPPORTED');
  }

  await navigator.share({
    files: [file],
    title: 'Auction Photo Session',
  });
}
