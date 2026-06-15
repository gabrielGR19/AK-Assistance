import { Router } from "express";

/*
  N8N WORKFLOW PLATZHALTER — BLOG POSTS
  n8n schickt wöchentlich neue Blogposts per POST an /api/blog
  Format (wenn bekannt):
  {
    id: number,
    date: string,
    category: string,
    title: string,
    excerpt: string,
    readTime: string,
    imageUrl?: string,
    link?: string
  }
  TODO: n8n Webhook hier anschließen wenn Format bekannt ist
*/

interface BlogPost {
  id: number;
  date: string;
  category: string;
  title: string;
  excerpt: string;
  readTime: string;
  imageUrl?: string;
  link?: string;
}

// In-memory store — wird durch n8n befüllt
// TODO: Durch persistenten Speicher ersetzen wenn n8n-Integration aktiv ist
const blogPosts: BlogPost[] = [];

const router = Router();

router.get("/blog", (_req, res) => {
  res.json({ posts: blogPosts });
});

router.post("/blog", (req, res) => {
  const { id, date, category, title, excerpt, readTime, imageUrl, link } =
    req.body as Partial<BlogPost>;

  if (!date || !category || !title || !excerpt || !readTime) {
    res.status(400).json({
      error: "Pflichtfelder fehlen: date, category, title, excerpt, readTime",
    });
    return;
  }

  const post: BlogPost = {
    id: id ?? Date.now(),
    date,
    category,
    title,
    excerpt,
    readTime,
    imageUrl,
    link,
  };

  // Neueste Beiträge zuerst
  blogPosts.unshift(post);

  req.log.info({ postId: post.id, title: post.title }, "Blog post added");
  res.status(201).json({ success: true, post });
});

export default router;
