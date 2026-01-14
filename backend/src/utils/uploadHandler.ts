import { UploadedFile } from 'express-fileupload';
import config from 'config';
import { uploadToCloudinary, CloudinaryUploadResult } from './cloudinaryUpload';
import { Upload } from '@aws-sdk/lib-storage';
import s3Client from '../aws/aws';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import { URL } from 'url';

export interface UploadResult {
    url: string;
    key: string;
}

/**
 * Uploads a file to the configured storage provider (Cloudinary or S3)
 * @param file - The file to upload
 * @param provider - Optional provider override. If not provided, uses config.get('storageProvider')
 * @returns Upload result with url and key
 */
export async function uploadFile(file: UploadedFile, provider?: string): Promise<UploadResult> {
    const storageProvider = provider || config.get<string>('storageProvider');

    if (storageProvider === 'cloudinary') {
        // Upload to Cloudinary
        const result: CloudinaryUploadResult = await uploadToCloudinary(file);
        return {
            url: result.url,
            key: result.public_id
        };
    } else {
        // Existing S3 upload logic (unchanged)
        const { mimetype, data, name } = file;
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: config.get<string>('s3.bucket'),
                Key: `${randomUUID()}${extname(name)}`,
                ContentType: mimetype,
                Body: data
            }
        });

        const result = await upload.done();
        const url = new URL(result.Location);
        return {
            url: url.pathname,
            key: `${randomUUID()}${extname(name)}`
        };
    }
}
