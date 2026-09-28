/// <reference types="nativewind/types" />

// NativeWind/Metro xử lý import CSS lúc build; TypeScript không tự biết shape của
// module này nên khai báo ambient để `import '../global.css'` không báo lỗi type.
declare module '*.css';
