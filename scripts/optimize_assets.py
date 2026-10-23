import os
from PIL import Image

def optimize_all():
    images = [
        'public/logo.png',
        'public/engine.png',
        'public/exhaust.png',
        'public/headlight.png',
        'public/seat.png',
        'public/tank.png',
        'public/bikes/bullet-350.png',
        'public/bikes/classic-350.png',
        'public/bikes/himalayan-450.png',
        'public/bikes/hunter-350.png',
        'public/bikes/meteor-350.png',
        'public/bikes/0493b03c-c92c-4449-b4d2-93b88ee2eec7.png',
        'public/images/classic-350/parts/headlamp.png',
        'public/images/classic-350/parts/seat.png',
        'public/images/classic-350/parts/engine.png',
        'public/images/classic-350/parts/exhaust.png',
        'public/images/classic-350/parts/tank.png',
    ]

    total_orig = 0
    total_opt = 0

    for path in images:
        if not os.path.exists(path):
            continue
        orig_sz = os.path.getsize(path)
        total_orig += orig_sz
        webp_path = os.path.splitext(path)[0] + '.webp'

        with Image.open(path) as img:
            # For logo, it is 2106x747 but only shown at ~140px in navbar.
            # Downscaling to 600px width produces razor-sharp 4x retina rendering at fraction of the size.
            if 'logo.png' in path:
                target_w = 600
                target_h = int(img.height * (target_w / img.width))
                img_opt = img.resize((target_w, target_h), Image.Resampling.LANCZOS)
                img_opt.save(webp_path, 'WEBP', quality=90, method=6)
                img_opt.save(path, 'PNG', optimize=True)
            else:
                img.save(webp_path, 'WEBP', quality=86, method=6)

        webp_sz = os.path.getsize(webp_path)
        total_opt += webp_sz
        saved_pct = (1 - webp_sz / orig_sz) * 100
        print(f"Optimized: {path} -> {webp_path} ({orig_sz/1024:.1f}KB -> {webp_sz/1024:.1f}KB, -{saved_pct:.1f}%)")

    print(f"\nTOTAL: {total_orig/1024/1024:.2f} MB -> {total_opt/1024/1024:.2f} MB (Saved {(1 - total_opt/total_orig)*100:.1f}%)")

if __name__ == '__main__':
    optimize_all()
