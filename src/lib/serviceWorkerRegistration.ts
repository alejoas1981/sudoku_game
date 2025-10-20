export function register(onUpdate: (registration: ServiceWorkerRegistration) => void) {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            const swUrl = '/sw.js';
            navigator.serviceWorker.register(swUrl)
                .then(registration => {
                    registration.onupdatefound = () => {
                        const installingWorker = registration.installing;
                        if (installingWorker) {
                            installingWorker.onstatechange = () => {
                                if (installingWorker.state === 'installed') {
                                    if (navigator.serviceWorker.controller) {
                                        // At this point, the updated precached content has been fetched,
                                        // but the previous service worker will still serve the older
                                        // content until all client tabs are closed.
                                        console.log(
                                            'New content is available and will be used when all tabs for this page are closed.'
                                        );

                                        // Execute callback
                                        onUpdate(registration);
                                    } else {
                                        // At this point, everything has been precached.
                                        // It's the perfect time to display a
                                        // "Content is cached for offline use." message.
                                        console.log('Content is cached for offline use.');
                                    }
                                }
                            };
                        }
                    };
                })
                .catch(error => {
                    console.error('Error during service worker registration:', error);
                });
        });
    }
}
