// TypeScript declarations for Eurostat Webtools
declare global {
  interface Window {
    cck: {
      init: (config: { kits: string }) => void;
    };
    globan: {
      init: (config: { kits: string }) => void;
    };
    $wt: {
      globan: {
        regenerate: (params?: { lang?: string; theme?: string; zindex?: number }) => void;
      };
      cck: {
        regenerate: (params?: { 
          lang?: string; 
          url?: string | Record<string, string>;
          appendix?: string | Record<string, string>;
          target?: boolean;
        }) => void;
        reset: () => void;
      };
      charts: {
        render: (container: string | HTMLElement, config: any) => {
          ready: (callback: (chart: any) => void) => any;
        };
      };
      render: (container: string | HTMLElement, config: any) => {
        ready: (callback: (chart: any) => void) => any;
      };
    };
  }
}

// Webtools global objects
declare const cck: {
  init: (config: { kits: string }) => void;
};

declare const globan: {
  init: (config: { kits: string }) => void;
};

// Webtools API object
declare const $wt: {
  globan: {
    regenerate: (params?: { lang?: string; theme?: string; zindex?: number }) => void;
  };
  cck: {
    regenerate: (params?: { 
      lang?: string; 
      url?: string | Record<string, string>;
      appendix?: string | Record<string, string>;
      target?: boolean;
    }) => void;
    reset: () => void;
  };
  charts: {
    render: (container: string | HTMLElement, config: any) => {
      ready: (callback: (chart: any) => void) => any;
    };
  };
  render: (container: string | HTMLElement, config: any) => {
    ready: (callback: (chart: any) => void) => any;
  };
};

export {};
