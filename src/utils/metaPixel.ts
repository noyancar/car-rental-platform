// utils/metaPixel.ts
export const MetaPixel = {
  track: (event: string, params?: Record<string, any>) => {
    if (typeof window !== "undefined" && (window as any).fbq) {
      // predefined events usage 
      // (window as any).fbq("track", event, params);
      
      // custom events usage
      (window as any).fbq("trackCustom", event, params);  // fbq("trackCustom", eventName, {params: value});

      console.log("Meta Pixel Event:", event, params);
    } else {
      console.warn("fbq not initialized yet");
    }
  },
};
