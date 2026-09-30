// Lazy toast helper.
//
// Statically importing `react-hot-toast` from the cart/wishlist providers pulls
// the whole toast runtime into the eager entry chunk, so it is parsed and
// evaluated on the initial-load critical path (adds to Total Blocking Time)
// even though a toast never fires until the user interacts.
//
// Instead we import it on demand. The first call dynamically loads the module
// (cached by the browser/bundler after that) and forwards the call. Toasts are
// user-triggered, so the tiny async delay before the very first toast is
// imperceptible and the library stays out of the initial bundle.

let toastPromise;

function loadToast() {
    if (!toastPromise) {
        toastPromise = import('react-hot-toast').then((m) => m.default);
    }
    return toastPromise;
}

export const toast = {
    success: (msg, opts) => loadToast().then((t) => t.success(msg, opts)),
    error: (msg, opts) => loadToast().then((t) => t.error(msg, opts)),
    loading: (msg, opts) => loadToast().then((t) => t.loading(msg, opts)),
    custom: (jsx, opts) => loadToast().then((t) => t.custom(jsx, opts)),
    dismiss: (id) => loadToast().then((t) => t.dismiss(id)),
};

export default toast;
