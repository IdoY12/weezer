import { UploadedFile } from 'express-fileupload';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import config from 'config';

// Configure Cloudinary using config package
cloudinary.config({
    cloud_name: config.get<string>('cloudinary.cloud_name'),
    api_key: config.get<string>('cloudinary.api_key'),
    api_secret: config.get<string>('cloudinary.api_secret')
});

export interface CloudinaryUploadResult {
    url: string;
    public_id: string;
}

export async function uploadToCloudinary(file: UploadedFile): Promise<CloudinaryUploadResult> {
    try {
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    resource_type: 'auto',
                    folder: 'weezer',
                },
                (error: Error | undefined, result: UploadApiResponse | undefined) => {
                    if (error) {
                        reject(error);
                    } else if (result) {
                        resolve({
                            url: result.secure_url,
                            public_id: result.public_id
                        });
                    } else {
                        reject(new Error('Upload failed: No result returned'));
                    }
                }
            );

            // Write the buffer to the upload stream
            uploadStream.end(file.data);
        });
    } catch (error) {
        throw new Error(`Cloudinary upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
