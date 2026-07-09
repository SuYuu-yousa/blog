---
title: "CI Test"
description: "Test Obsidian save to GitHub and Cloudflare deploy"
pubDate: 2026-07-09
lang: zh
tags: []
draft: false
---
TypeScript

```
// 定义对象的"形状"
interface User {
  id: number;
  name: string;
  age?: number;        // 可选属性
  readonly email: string; // 只读属性
}

//函数后面加个冒号说明返回类型，可以不写，自动推断，可以void 
function greet(user: User): string {
  return `Hello, ${user.name}`;
}

// ✅ 正确
greet({ id: 1, name: "Tom", email: "tom@example.com" });

// ❌ 编译报错：缺少必要属性
greet({ name: "Tom" });
```
This is a CI/CD test post.
![](Pasted%20image%2020260709161427.png)
