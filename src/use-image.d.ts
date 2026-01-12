declare module 'use-image' {
    export type CrossOrigin = 'anonymous' | 'use-credentials';
    export type Status = 'loading' | 'loaded' | 'failed';

    function useImage(
        url: string,
        crossOrigin?: CrossOrigin,
        referrerPolicy?: string
    ): [HTMLImageElement | undefined, Status];

    export default useImage;
}
