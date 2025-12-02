import JSEncrypt from 'jsencrypt';
import CryptoJS from 'crypto-js';

const PUBLIC_KEY = 'MFwwDQYJKoZIhvcNAQEBBQADSwAwSAJBAJL0JkqsUoK6kt3JyogsgqNp9VDGDp+t3ZAGMbVoMPdHNT2nfiIVh9ZMNHF7g2XiAa8O8AQWyh2PjMR0NiUSVQMCAwEAAQ==';

export function encryptPassword(password: string): string {
	const encryptor = new JSEncrypt({});
	encryptor.setPublicKey(PUBLIC_KEY);
	// Java uses RSA/ECB/PKCS1Padding, which matches JSEncrypt default
	const encrypted = encryptor.encrypt(password);
	if (!encrypted) throw new Error('Encryption failed');
	return encrypted;
}

export function getDeviceID(): string {
	if (typeof localStorage === 'undefined') return 'MOCK_DEVICE_ID';
	
	let deviceId = localStorage.getItem('device_uuid');
	if (deviceId) return deviceId;

	// Simulate the Java generation logic: MD5(Mac + ShortDevID)
	// Since we can't get real Mac/Build, we generate random values
	const randomString = Math.random().toString(36).substring(2) + Date.now().toString();
	const hash = CryptoJS.MD5(randomString).toString(CryptoJS.enc.Hex).toUpperCase();
	
	// The Java code produces a hex string. MD5 hex is 32 chars.
	// The example device_id in raw request is "3d802229-6400-3b4e-9f4e-40f669369bbc" (UUID format)
	// Wait, device.java says:
	// return UUID.nameUUIDFromBytes(string.getBytes("utf8")).toString();
	// OR DeviceIDUtil.getUniqueDeviceID() (which is MD5 hex)
	
	// The raw request has a UUID: 3d802229-6400-3b4e-9f4e-40f669369bbc
	// So likely it's using the UUID branch in device.java
	
	// Let's generate a UUID v4
	deviceId = crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
		return v.toString(16);
	});

	localStorage.setItem('device_uuid', deviceId);
	return deviceId;
}
