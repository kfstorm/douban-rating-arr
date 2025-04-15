// React props access script
// This script runs in the page context and accesses React properties for elements
(function() {
  // Helper function to safely get a property by path
  function getPropertyByPath(obj, path) {
    if (!obj || !path) return obj;

    // Split path by dots, but handle array notation properly
    const parts = [];
    let currentPart = '';
    let inBracket = false;

    for (let i = 0; i < path.length; i++) {
      const char = path[i];
      if (char === '.' && !inBracket) {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = '';
        }
      } else if (char === '[') {
        if (currentPart) {
          parts.push(currentPart);
          currentPart = '';
        }
        inBracket = true;
        currentPart += char;
      } else if (char === ']') {
        currentPart += char;
        inBracket = false;
      } else {
        currentPart += char;
      }
    }

    if (currentPart) {
      parts.push(currentPart);
    }

    // Navigate through the path
    let current = obj;
    for (let i = 0; i < parts.length; i++) {
      let part = parts[i];

      // Handle array notation like [0], [1], etc.
      if (part.startsWith('[') && part.endsWith(']')) {
        part = part.substring(1, part.length - 1);
      }

      if (current === undefined || current === null) {
        return undefined;
      }

      current = current[part];
    }

    return current;
  }

  // Helper function to safely stringify objects, even with circular references
  function safeStringify(obj) {
    const seen = new WeakSet();
    return JSON.stringify(obj, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]';
        }
        seen.add(value);
      }
      return value;
    });
  }

  // Set up message listener to receive requests from content script
  window.addEventListener('message', function(event) {
    // Make sure the message is from our page
    if (event.source !== window) return;

    // Listen for requests to get React props
    if (event.data.type === 'GET_REACT_PROPS') {
      try {
        const elementSelector = event.data.selector;
        const requestId = event.data.requestId;
        const propPath = event.data.propPath; // Optional path to extract specific props

        // Find only the first element that matches the selector
        const element = document.querySelector(elementSelector);

        if (!element) {
          // If no element found, send back a response
          window.postMessage({
            type: 'REACT_PROPS_RESPONSE',
            requestId: requestId,
            success: false,
            error: 'No element found matching selector'
          }, '*');
          return;
        }

        let reactProps = null;

        // Find React fiber/instance
        let reactKey = Object.keys(element).find(key =>
          key.startsWith('__reactFiber$') ||
          key.startsWith('__reactInternalInstance$')
        );

        let reactData = null;
        if (reactKey) {
          reactData = element[reactKey];
        }

        // Extract props if we have react data
        if (reactData) {
          // Navigate to the instance that holds props
          let fiber = reactData;
          while (fiber) {
            if (fiber.memoizedProps && typeof fiber.memoizedProps === 'object') {
              reactProps = fiber.memoizedProps;
              break;
            }
            fiber = fiber.return;
          }
        }

        // If a specific prop path is requested, extract only that part
        let propsToSend = reactProps;
        if (propPath && reactProps) {
          propsToSend = getPropertyByPath(reactProps, propPath);
        }

        // Send props back to content script using safe stringify
        window.postMessage({
          type: 'REACT_PROPS_RESPONSE',
          requestId: requestId,
          payload: propsToSend ? safeStringify(propsToSend) : null,
          success: true
        }, '*');
      } catch(e) {
        // Send error response
        window.postMessage({
          type: 'REACT_PROPS_RESPONSE',
          requestId: event.data.requestId,
          success: false,
          error: e.message
        }, '*');
      }
    }
  });

  // Send ready message to let content script know this script is loaded and listening
  window.postMessage({
    type: 'REACT_PROPS_SCRIPT_READY'
  }, '*');
})();
