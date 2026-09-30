import React, { Suspense } from 'react';

// The rich-text editor (react-quill-new + quill + its CSS) is large (~200KB JS
// and ~24KB CSS) and only ever used inside admin forms. Importing it lazily
// here — including the stylesheet via a dynamic import — guarantees it stays
// out of the storefront's initial bundle and is never referenced from the
// entry index.html. It only downloads when an admin actually opens an editor.
const LazyQuill = React.lazy(async () => {
    const [{ default: ReactQuill }] = await Promise.all([
        import('react-quill-new'),
        import('react-quill-new/dist/quill.snow.css'),
    ]);
    return { default: ReactQuill };
});

const EditorFallback = () => (
    <div className="min-h-[150px] w-full animate-pulse bg-[#F5EFE0]/60" />
);

export default function RichTextEditor(props) {
    return (
        <Suspense fallback={<EditorFallback />}>
            <LazyQuill {...props} />
        </Suspense>
    );
}
