import { useEffect } from 'react';

/**
 * Hook to initialize ECL components
 * Should be used in components that use ECL JavaScript functionality
 */
export const useECLInit = () => {
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 10;
    
    // Wait for ECL to be loaded and initialize components
    const initECL = () => {
      if (typeof window !== 'undefined' && (window as any).ECL) {
        const ECL = (window as any).ECL;
        
        try {
          // Initialize all ECL components with auto-init attribute
          if (typeof ECL.autoInit === 'function') {
            ECL.autoInit();
            
            // Also manually initialize Select components after autoInit
            setTimeout(() => {
              const selectElements = document.querySelectorAll('[data-ecl-auto-init="Select"]:not([data-ecl-auto-initialized])');
              
              if (ECL.Select && typeof ECL.Select.autoInit === 'function') {
                selectElements.forEach(element => {
                  try {
                    ECL.Select.autoInit(element);
                  } catch (error) {
                    console.warn('Failed to initialize select element:', error);
                  }
                });
              }
            }, 100);
            
          } else {
            // Manually initialize Select components if autoInit is not available
            if (ECL.Select && typeof ECL.Select.autoInit === 'function') {
              const selectElements = document.querySelectorAll('[data-ecl-auto-init="Select"]');
              selectElements.forEach(element => {
                try {
                  ECL.Select.autoInit(element);
                } catch (error) {
                  console.warn('Failed to initialize select element:', error);
                }
              });
            }
          }
        } catch (error) {
          console.error('Error initializing ECL:', error);
        }
      } else {
        retryCount++;
        if (retryCount < maxRetries) {
          // Retry after a short delay
          setTimeout(initECL, 200);
        }
      }
    };

    // Initialize with multiple attempts
    const timers = [50, 200, 500, 1000].map(delay => 
      setTimeout(initECL, delay)
    );

    // Also listen for DOM changes to catch dynamically added elements
    const observer = new MutationObserver((mutations) => {
      let hasNewSelects = false;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            const element = node as Element;
            if (element.matches('[data-ecl-auto-init="Select"]') || 
                element.querySelector('[data-ecl-auto-init="Select"]')) {
              hasNewSelects = true;
            }
          }
        });
      });
      
      if (hasNewSelects && (window as any).ECL) {
        setTimeout(initECL, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => {
      timers.forEach(clearTimeout);
      observer.disconnect();
    };
  }, []);
};

/**
 * Hook to manually initialize specific ECL components
 * @param selector - CSS selector for the component to initialize
 * @param componentName - Name of the ECL component (e.g., 'Select', 'Accordion')
 */
export const useECLComponent = (selector: string, componentName: string) => {
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ECL) {
      const ECL = (window as any).ECL;
      const elements = document.querySelectorAll(selector);
      
      elements.forEach((element) => {
        if (ECL[componentName] && typeof ECL[componentName] === 'function') {
          try {
            new ECL[componentName](element);
          } catch (error) {
            console.warn(`Failed to initialize ECL ${componentName}:`, error);
          }
        } else {
          console.warn(`ECL.${componentName} not found`);
        }
      });
    }
  }, [selector, componentName]);
};
