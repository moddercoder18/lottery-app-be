import { S3 } from 'aws-sdk';
import { Injectable } from '@nestjs/common';
@Injectable()
export class FileUploadService {
    async upload(file: any): Promise<string> {
        const { originalname } = file;
        const bucketS3 = process.env.BUCKET_NAME || '';
        return this.uploadS3(file, file.buffer, bucketS3, originalname);
    }

    async uploadS3(fileFull: any, file: any, bucket: string, fileName: string): Promise<string> {
        const s3 = this.getS3();
        const params = {
            Bucket: bucket,
            Key: `${new Date().getTime()}_${fileName}`,
            Body: file,
            ContentType: fileFull.mimetype.includes('audio') ? 'audio/mp3' : fileFull.mimetype,
        };
        return new Promise((resolve, reject) => {
            s3.upload(params, (err: Error, data: any) => {
                if (err) {
                    return reject(err.message);
                }
                resolve(data?.Location || '');
            });
        });
    }

    async deleteS3(fileUrl: string): Promise<void> {
        const fileName = fileUrl.split('.com/')[fileUrl.split('.com/').length - 1];
        const s3 = this.getS3();
        const params = {
            Bucket: process.env.BUCKET_NAME || '',
            Key: fileName,
        };
        return new Promise((resolve, reject) => {
            s3.deleteObject(params, (err: Error, data: any) => {
                if (err) {
                    console.info('error ====>', err);
                }
                resolve(data);
            });
        });
    }

    getS3() {
        return new S3({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        });
    }
}