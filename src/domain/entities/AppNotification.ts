export type AppNotification = {
  id: number;
  userId: number;
  businessId: number;
  title: string;
  body: string;
  logoUrl: string | null;
  createdAt: string;      
  businessName: string;   
};