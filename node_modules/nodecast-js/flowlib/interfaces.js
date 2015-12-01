declare module "http" {
    declare function get(
        address: any,
        callback: (res: any) => void
    ): any;
}
