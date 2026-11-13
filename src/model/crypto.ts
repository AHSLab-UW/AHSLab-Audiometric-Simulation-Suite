import sjcl from 'sjcl';

// Obfuscation only: keeps students from reading a simulated patient's thresholds
// in a text editor. Kept identical to earlier versions so existing files still load.
const KEY = 'MagicResultKey';

export const encryptText = (text: string): string => sjcl.encrypt(KEY, text) as unknown as string;
export const decryptText = (text: string): string => sjcl.decrypt(KEY, text);
