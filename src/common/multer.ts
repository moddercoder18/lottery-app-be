import {existsSync, mkdirSync} from "fs";
import {diskStorage, memoryStorage} from "multer";
import {ErrorMessageException} from "./exceptions";
import {Request} from "express";

export const MULTER_LOCAL_DESTINATION = "./uploads";
export const destination = (req: any, file: any, cb: any) => {
  const uploadPath = MULTER_LOCAL_DESTINATION;
  // Create folder if doesn't exist
  if (!existsSync(uploadPath)) {
    mkdirSync(uploadPath);
  }
  cb(null, uploadPath);
};
export const multerStorage = process.env.AWS_ACCESS_KEY_ID ? memoryStorage() : diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadPath = MULTER_LOCAL_DESTINATION;
    // Create folder if doesn't exist
    if (!existsSync(uploadPath)) {
      mkdirSync(uploadPath);
    }
    cb(null, uploadPath);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, fileName: string) => void,
  ) => {
    cb(null, `${Date.now().toString()}_${file.originalname}`);
  },
});

export const imageFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const filenameArr = file?.originalname.split(".") || [];
  const ext = filenameArr[filenameArr?.length - 1] || "";
  const isValid = ["jpg", "jpeg", "png", "gif"].includes(ext);
  cb(
    !isValid ? ErrorMessageException("Only image file can be supported") : null,
    isValid,
  );
};

export const excelFileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  const filenameArr = file?.originalname.split(".") || [];
  const ext = filenameArr[filenameArr?.length - 1] || "";
  const isValid = ["xlsx", "xlsm", "xlsb", "xltx", "xltm", "xls", "xlt", "xls", "xml", "xlam", "xla", "xlw", "xlr"].includes(ext);
  cb(
    !isValid ? ErrorMessageException("Only excel file can be supported") : null,
    isValid,
  );
}