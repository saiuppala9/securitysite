declare module '@mantine/dropzone' {
  import { ComponentPropsWithoutRef, ReactNode } from 'react';
  
  export interface DropzoneProps extends ComponentPropsWithoutRef<'div'> {
    onDrop: (files: FileWithPath[]) => void;
    onReject?: (files: FileRejection[]) => void;
    maxSize?: number;
    accept?: Record<string, string[]>;
    multiple?: boolean;
    children?: ReactNode;
    styles?: Record<string, any>;
    loading?: boolean;
    disabled?: boolean;
  }
  
  export interface FileWithPath extends File {
    path?: string;
  }
  
  export interface FileRejection {
    file: FileWithPath;
    errors: {
      code: string;
      message: string;
    }[];
  }
  
  export function Dropzone(props: DropzoneProps): JSX.Element;
} 