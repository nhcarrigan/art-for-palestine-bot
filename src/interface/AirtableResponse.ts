export interface AirtableResponse {
  records: {
    id: string;
    createdTime: string;
    fields: {
      "Anything Else?"?: string;
      Reference: {
        id: string;
        width?: number;
        height?: number;
        url: string;
        filename: string;
        size: number;
        type: string;
        thumbnails?: {
          small: {
            url: string;
            width: number;
            height: number;
          };
          large: {
            url: string;
            width: number;
            height: number;
          };
          full: {
            url: string;
            width: number;
            height: number;
          };
        };
      }[];
      "Acknowledgement "?: boolean;
      "Email Address"?: string;
      "What would you like us to draw?"?: string;
      Action: string;
      Name: string;
      "Contact Method": string;
      Created: string;
      "Proof of Donation"?: {
        id: string;
        width: number;
        height: number;
        url: string;
        filename: string;
        size: number;
        type: string;
        thumbnails: {
          small: {
            url: string;
            width: number;
            height: number;
          };
          large: {
            url: string;
            width: number;
            height: number;
          };
          full: {
            url: string;
            width: number;
            height: number;
          };
        };
      }[];
      "Donation Amount"?: number;
      Fund?: string;
      Handle?: string;
    };
  }[];
}
