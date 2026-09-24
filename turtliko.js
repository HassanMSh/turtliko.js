// turtliko.js: https://github.com/HassanMSh/turtliko.js
// A little pixel turtle that swims after your mouse and blows bubbles.
// Based on oneko.js by adryd (https://github.com/adryd325/oneko.js), MIT License.

(function turtliko() {
  const isReducedMotion =
    window.matchMedia(`(prefers-reduced-motion: reduce)`) === true ||
    window.matchMedia(`(prefers-reduced-motion: reduce)`).matches === true;

  if (isReducedMotion) return;

  const turtleEl = document.createElement("div");
  let persistPosition = true;
  let showBubbles = true;

  let turtlePosX = 32;
  let turtlePosY = 32;

  let mousePosX = 0;
  let mousePosY = 0;

  let frameCount = 0;
  let idleTime = 0;
  let lastDirection = "E";

  // Pixels moved per step (a step is about 100ms).
  const turtleSpeed = 5;
  // Steps per swim frame: the turtle paddles every other step.
  const frameSteps = 2;

  const curScript = document.currentScript;

  // Return the four swim frames that start at (col, row) on the sprite sheet.
  function swimFrames(col, row) {
    return [0, 1, 2, 3].map((i) => [-(col + i), -row]);
  }

  // Sprite sheet is 8 x 4 tiles of 32px. Rows are N|NE, E|SE, S|SW, W|NW, four swim frames each.
  const spriteSets = {
    N: swimFrames(0, 0),
    NE: swimFrames(4, 0),
    E: swimFrames(0, 1),
    SE: swimFrames(4, 1),
    S: swimFrames(0, 2),
    SW: swimFrames(4, 2),
    W: swimFrames(0, 3),
    NW: swimFrames(4, 3),
  };

  // Read a true/false option from a data attribute. An empty attribute counts as true.
  function readFlag(value, fallback) {
    if (value === undefined) return fallback;
    if (value === "") return true;
    return JSON.parse(value.toLowerCase());
  }

  function init() {
    let turtleFile = "./turtliko.png";
    if (curScript && curScript.dataset.turtle) {
      turtleFile = curScript.dataset.turtle;
    }
    if (curScript) {
      persistPosition = readFlag(curScript.dataset.persistPosition, persistPosition);
      showBubbles = readFlag(curScript.dataset.bubbles, showBubbles);
    }

    if (persistPosition) {
      let stored = null;
      try {
        stored = JSON.parse(window.localStorage.getItem("turtliko"));
      } catch {}
      if (stored !== null) {
        turtlePosX = stored.turtlePosX;
        turtlePosY = stored.turtlePosY;
        mousePosX = stored.mousePosX;
        mousePosY = stored.mousePosY;
        frameCount = stored.frameCount;
        idleTime = stored.idleTime;
        lastDirection = stored.lastDirection || lastDirection;
        turtleEl.style.backgroundPosition = stored.bgPos;
      }
    }

    turtleEl.id = "turtliko";
    turtleEl.ariaHidden = true;
    turtleEl.style.width = "32px";
    turtleEl.style.height = "32px";
    turtleEl.style.position = "fixed";
    turtleEl.style.pointerEvents = "none";
    turtleEl.style.imageRendering = "pixelated";
    turtleEl.style.left = `${turtlePosX - 16}px`;
    turtleEl.style.top = `${turtlePosY - 16}px`;
    turtleEl.style.zIndex = 2147483647;

    turtleEl.style.backgroundImage = `url(${turtleFile})`;

    document.body.appendChild(turtleEl);

    document.addEventListener("mousemove", function (event) {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    });

    if (persistPosition) {
      window.addEventListener("beforeunload", function () {
        // A turtle that was removed from the page must not overwrite a newer one.
        if (!turtleEl.isConnected) return;
        try {
          window.localStorage.setItem(
            "turtliko",
            JSON.stringify({
              turtlePosX: turtlePosX,
              turtlePosY: turtlePosY,
              mousePosX: mousePosX,
              mousePosY: mousePosY,
              frameCount: frameCount,
              idleTime: idleTime,
              lastDirection: lastDirection,
              bgPos: turtleEl.style.backgroundPosition,
            })
          );
        } catch {}
      });
    }

    window.requestAnimationFrame(onAnimationFrame);
  }

  let lastFrameTimestamp;

  // Run one step about every 100ms. Stops for good once the turtle element is removed.
  function onAnimationFrame(timestamp) {
    if (!turtleEl.isConnected) {
      return;
    }
    if (!lastFrameTimestamp) {
      lastFrameTimestamp = timestamp;
    }
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }
    window.requestAnimationFrame(onAnimationFrame);
  }

  // Show frame number `frame` (wraps around) of the sprite set `name`.
  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    turtleEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  // Add one small bubble at (x, y) that drifts up, fades out, and removes itself.
  // Does nothing when bubbles are turned off with data-bubbles="false".
  function spawnBubble(x, y) {
    if (!showBubbles) return;
    const size = 4 + Math.random() * 5;
    const bubble = document.createElement("div");
    bubble.ariaHidden = true;
    bubble.className = "turtliko-bubble";
    Object.assign(bubble.style, {
      position: "fixed",
      left: `${x - size / 2}px`,
      top: `${y - size / 2}px`,
      width: `${size}px`,
      height: `${size}px`,
      borderRadius: "50%",
      border: "1px solid rgba(96, 165, 250, 0.9)",
      background:
        "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.95), rgba(147, 197, 253, 0.35) 60%)",
      pointerEvents: "none",
      zIndex: 2147483646,
    });
    document.body.appendChild(bubble);
    const drift = (Math.random() - 0.5) * 16;
    const rise = 30 + Math.random() * 30;
    const animation = bubble.animate(
      [
        { transform: "translate(0, 0) scale(0.6)", opacity: 0.9 },
        { transform: `translate(${drift}px, ${-rise}px) scale(1)`, opacity: 0 },
      ],
      { duration: 1200 + Math.random() * 800, easing: "ease-out" }
    );
    animation.onfinish = () => bubble.remove();
  }

  // Random offset in [-range, range], used to scatter bubbles a little.
  function jitter(range) {
    return (Math.random() - 0.5) * 2 * range;
  }

  // Near the mouse: keep facing the same way, paddle slowly,
  // and let out a bubble now and then (about one every 1.2 seconds).
  function idle() {
    idleTime += 1;
    setSprite(lastDirection, Math.floor(idleTime / 4));
    if (Math.random() < 0.08) {
      spawnBubble(turtlePosX + jitter(8), turtlePosY - 10 + jitter(4));
    }
  }

  // One step: rest near the mouse, or swim one step toward it and leave a bubble trail.
  function frame() {
    frameCount += 1;
    const diffX = turtlePosX - mousePosX;
    const diffY = turtlePosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < turtleSpeed || distance < 48) {
      idle();
      return;
    }

    idleTime = 0;

    let direction;
    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";
    lastDirection = direction;
    setSprite(direction, Math.floor(frameCount / frameSteps));

    // Leave a trail of bubbles behind the turtle (every third step).
    // (diffX, diffY) points from the mouse to the turtle, so adding it moves toward the tail.
    if (frameCount % 3 === 0) {
      spawnBubble(
        turtlePosX + (diffX / distance) * 14 + jitter(4),
        turtlePosY + (diffY / distance) * 14 + jitter(4)
      );
    }

    turtlePosX -= (diffX / distance) * turtleSpeed;
    turtlePosY -= (diffY / distance) * turtleSpeed;

    turtlePosX = Math.min(Math.max(16, turtlePosX), window.innerWidth - 16);
    turtlePosY = Math.min(Math.max(16, turtlePosY), window.innerHeight - 16);

    turtleEl.style.left = `${turtlePosX - 16}px`;
    turtleEl.style.top = `${turtlePosY - 16}px`;
  }

  init();
})();
