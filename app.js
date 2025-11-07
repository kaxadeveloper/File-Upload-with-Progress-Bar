const form = document.querySelector("form"),
  fileInput = form.querySelector(".file-input"),
  progressArea = document.querySelector(".progress-area"),
  uploadedArea = document.querySelector(".uploaded-area");

let folderHandle = null;

// ✅ Run everything in a real user click
form.addEventListener("click", async () => {
  try {
    // Ask for folder only once
    if (!folderHandle) {
      folderHandle = await window.showDirectoryPicker();
    }

    // Open file picker right after user click
    fileInput.click();

    fileInput.onchange = async ({ target }) => {
      const file = target.files[0];
      if (file) {
        await handleFileUpload(file);
      }
    };
  } catch (err) {
    console.error(err);
    alert("Permission denied or folder access canceled.");
  }
});

async function handleFileUpload(file) {
  let displayName = file.name;
  if (displayName.length >= 12) {
    let splitName = displayName.split(".");
    displayName = splitName[0].substring(0, 12) + "... ." + splitName[1];
  }

  // Create file in selected folder
  const newFileHandle = await folderHandle.getFileHandle(file.name, { create: true });
  const writable = await newFileHandle.createWritable();

  // UI progress setup
  let progressHTML = `
    <li class="row">
      <i class="fas fa-file-alt"></i>
      <div class="content">
        <div class="details">
          <span class="name">${displayName} • Uploading</span>
          <span class="percent">0%</span>
        </div>
        <div class="progress-bar">
          <div class="progress"></div>
        </div>
      </div>
    </li>`;
  progressArea.innerHTML = progressHTML;
  uploadedArea.classList.add("onprogress");

  const progress = progressArea.querySelector(".progress");
  const percent = progressArea.querySelector(".percent");

  const reader = file.stream().getReader();
  let loaded = 0;
  let total = file.size;

  // Write in chunks to simulate progress
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    await writable.write(value);
    loaded += value.length;
    const percentLoaded = Math.floor((loaded / total) * 100);
    progress.style.width = `${percentLoaded}%`;
    percent.textContent = `${percentLoaded}%`;
  }

  await writable.close();

  // Finish UI
  progressArea.innerHTML = "";
  let fileTotal = Math.floor(file.size / 1000);
  let fileSizeText = fileTotal < 1024 ? fileTotal + " KB" : (fileTotal / 1024).toFixed(2) + " MB";

  let uploadedHTML = `
    <li class="row">
      <div class="content">
        <i class="fas fa-file-alt"></i>
        <div class="details">
          <span class="name">${displayName} • Saved</span>
          <span class="size">${fileSizeText}</span>
        </div>
      </div>
      <i class="fas fa-check"></i>
    </li>`;
  uploadedArea.classList.remove("onprogress");
  uploadedArea.insertAdjacentHTML("afterbegin", uploadedHTML);
}

