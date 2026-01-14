import { NextFunction, Request, Response } from "express";
import { UploadedFile } from "express-fileupload";
import { uploadFile } from "../utils/uploadHandler";



declare global {
    namespace Express {
        interface Request {
            imageUrl: string
        }
    }
}

export default async function fileUploader(req: Request, res: Response, next: NextFunction) {
    console.log('📤 fileUploader middleware called');
    console.log('📤 req.files:', req.files);
    
    if (!req.files) {
        console.log('⚠️ No files in request');
        return next();
    }
    
    if (!req.files.image) {
        console.log('⚠️ No image file in request. Available files:', Object.keys(req.files));
        return next();
    }

    try {
        console.log('📤 Uploading file:', {
            name: (req.files.image as UploadedFile).name,
            mimetype: (req.files.image as UploadedFile).mimetype,
            size: (req.files.image as UploadedFile).size
        });
        
        const result = await uploadFile(req.files.image as UploadedFile);
        console.log('✅ Upload successful:', result);
        
        req.imageUrl = result.url;
        next();
    } catch (error) {
        console.error('❌ Upload failed:', error);
        return next({
            status: 500,
            message: `File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
    }
}