# Bakery Films Image System

## Folder structure

```text
public/assets/
  images/
    home/
    capabilities/
    work/
    studio/
    experiments/
    contact/
  video/
```

Images are served from `/assets/images/...`.
Videos are served from `/assets/video/...`.

## Filename format

```text
[page-code]-[sequence]-[role]-[subject]-[variant].[extension]
```

Example:

```text
wrk-01-hero-woman-a.webp
wrk-01-frame-woman-b.jpg
cap-03-detail-campaign-a.webp
```

Use lowercase letters, hyphens only, and no spaces.

## Page codes

| Page | Code | Folder |
| --- | --- | --- |
| Home | `hm` | `images/home/` |
| Capabilities | `cap` | `images/capabilities/` |
| Work | `wrk` | `images/work/` |
| Studio | `std` | `images/studio/` |
| Experiments | `exp` | `images/experiments/` |
| Contact | `cnt` | `images/contact/` |

## Numbering

- `01` to `99` identifies the content item or project.
- Use `00` for page-wide or shared images.
- Use `a`, `b`, `c` for alternate crops or versions of the same image.
- Keep sequence numbers stable after an image is published.

## Role names

Use one of these role names:

- `hero` - primary opening image
- `frame` - project or editorial frame
- `poster` - video poster image
- `detail` - close crop or material study
- `thumb` - index or navigation thumbnail
- `og` - social sharing image
- `logo` - brand mark

## Image requirements

- Preferred format: `.webp`
- Use `.jpg` for photographic source images that need broad compatibility.
- Use `.png` only for transparency or graphics requiring lossless edges.
- Use `1600px` minimum width for full-width images.
- Use `2400px` width for hero or full-bleed images when available.
- Use `1200px` minimum width for work frames and editorial images.
- Keep important subjects inside the central 80% safe area for responsive crops.
- Compress images before adding them. Target under `500 KB` for thumbnails and under `1.5 MB` for hero images.
- Every image used in markup must have meaningful alt text.

## Recommended dimensions

| Role | Ratio | Recommended size |
| --- | --- | --- |
| `hero` | 16:9 or 2.39:1 | 2400 x 1350 or 2400 x 1004 |
| `frame` | 4:5, 3:4, or 16:9 | 1600px wide minimum |
| `poster` | Match its video | 1920px wide minimum |
| `detail` | Flexible editorial crop | 1200px wide minimum |
| `thumb` | 4:3 | 800 x 600 |
| `og` | 1.91:1 | 1200 x 630 |

## Work project examples

```text
wrk-01-hero-woman-a.webp
wrk-01-frame-woman-b.webp
wrk-01-detail-silk-a.webp
wrk-02-hero-city-a.webp
wrk-03-poster-desert-a.webp
wrk-04-frame-tokyo-a.webp
wrk-05-hero-hotel-a.webp
```

## Checklist before adding an image

1. Choose the correct page folder.
2. Assign the next stable number.
3. Name the role and subject clearly.
4. Export in the required ratio and format.
5. Add meaningful alt text when wiring it into a page.
6. Confirm the image path begins with `/assets/images/`.
