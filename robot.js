const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const { takeScreenshot } = require('./index');
const { jalankansemua } = require('./control');
const { exec } = require('child_process');
const path = require('path'); // Import path module

// Deklarasi fungsi control mouse cursor untuk Gemini model
const controlmouse = {
    name: "control_mouse_cursor",
    description: "Mengontrol pergerakan kursor mouse dengan presisi",
    parameters: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["move", "click", "double_click", "right_click", "drag", "scroll"],
          description: "Jenis aksi yang akan dilakukan"
        },
        x: {
          type: "number",
          description: "Koordinat X layar,nilai maksimal 1599"
        },
        y: {
          type: "number",
          description: "Koordinat Y layar,nilai maksimal 899"
        },
        button: {
          type: "string",
          enum: ["left", "right", "middle"],
          description: "Tombol mouse yang digunakan, defaultnya adalah `left`"
        },
        scroll_amount: {
            type: "number",
            description: "Jumlah scroll (positif/negatif), nilai antara -100 dan 100"
        }
      },
      required: ["action"]
    }
  };

  const typeTextDeclaration = {
      name: "type_text",
      description: "Mengetik teks ke aplikasi yang aktif",
      parameters: {
        type: "object",
        properties: {
          text: {
            type: "string",
            description: "Teks yang akan diketik"
          },
           typingSpeed: {
              type: "number",
              description: "Kecepatan mengetik dalam milidetik per karakter. Nilai yang lebih rendah akan mengetik lebih cepat."
          }
        },
        required: ["text"]
      }
    };
const keyboardShortcutDeclaration = {
    name: "keyboard_shortcut",
    description: "Melakukan shortcut keyboard dengan kombinasi modifier key dan key",
    parameters: {
        type: "object",
        properties: {
            modifierKey: {
                type: "string",
                 enum: ["control", "shift", "alt", "windows", "command", "delete"],
                description: "Tombol modifier (contoh: control, shift, alt, windows, command, delete)"
            },
            keyToTap: {
                type: "string",
                description: "Tombol yang akan ditekan"
            }
        },
        required: ["modifierKey", "keyToTap"]
    }
}

  const deleteSelectedTextDeclaration = {
    name: "delete_selected_text",
    description: "Menghapus teks yang sedang di pilih(Select_text)"
  };

  const selectTextDeclaration = {
      name: "select_text",
      description: "Menyeleksi teks menggunakan kombinasi tombol keyboard",
      parameters: {
          type: "object",
          properties: {
            modifierKey: {
                type: "string",
                enum: ["control", "shift", "alt"],
                description: "Tombol modifier (contoh: control, shift, alt)"
            },
            keyToTap: {
                type: "string",
                description: "Tombol yang akan ditekan"
            }
          },
          required: ["keyToTap"]
      }
    };
// Inisialisasi Model dengan Function Declaration
const genAI = new GoogleGenerativeAI("YOUR_API_KEY");
const generativeModel = genAI.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      candidateCount: 1,
      stopSequences: ["x"],
      maxOutputTokens: 20,
      temperature: 1.0,
    },
    systemInstruction: `kamu adalah Asisten Yang ahli dalam mengarahkan kursor mouse dan ahli membaca gambar,Manfaatkanlah Video Gambar yang ada gridnya untuk mengarahkan kursor mousenya ke titik tujuan,Jika ada tulisan yang terpenuhi pada aplikasi yang aktif maka dihapus,dan jika ada prompt: "Hallo\nsiapa namamu? maka respon: "Hallo <keyboard enter> siapa namamu?`,
    tools: { functionDeclarations: [controlmouse, typeTextDeclaration, deleteSelectedTextDeclaration, selectTextDeclaration, keyboardShortcutDeclaration] },
    toolConfig: {functionCallingConfig: {mode: "ANY",
      allowedFunctionNames: ["select_text","type_text","keyboard_shortcut","control_mouse_cursor"]
    }}
});
function fileToGenerativePart(path, mimeType) {
  try {
      if (!fs.existsSync(path)) {
        throw new Error(`File not found: ${path}`);
      }
      return {
        inlineData: {
          data: Buffer.from(fs.readFileSync(path)).toString("base64"),
          mimeType,
        },
      };
    } catch (error) {
      console.error("Error converting file:", error);
      throw error;
    }
}
const chat = generativeModel.startChat({ history: [
  {
      role: "user",
      parts: [
          { text: `Video gambar dibawah ini berisi koordinat,dan untuk panduan anda`
      }
      ],
  },
  {
      "role": "model",
      "parts": [{
          text: "Ok Siap",
      }],
  },
],
});

// Fungsi untuk mengonversi file menjadi bagian generatif


// Fungsi utama untuk memproses hasil dari model
async function hasil(prompt) {
  // Jalankan grid.py sebelum melakukan apa pun
  const gridScriptPath = path.join(__dirname, "grid.py"); // Path lengkap ke script grid.py
  const outputRecordPath = path.join(__dirname, 'output_record'); // path ke folder output
    
  // Jalankan grid.py menggunakan child_process.exec
  console.log("Mulai Perekaman dengan grid.py...");
  console.log("Lanjut ke proses bot");
  await new Promise((resolve, reject)=>{
    try {
    takeScreenshot();
    resolve();
    }catch(error){
      reject(error);
    }
  })
  const imagePart = [fileToGenerativePart('./output_record/screen_recording_with_mouse_coordinates.mp4', "video/mp4"),fileToGenerativePart('./screenshot12.jpg', "image/jpeg")];
   let textInput = [prompt];
    if (imagePart) {
      textInput.push(...imagePart);
    }
   // Panggil model dan kirim prompt
  const result = await chat.sendMessage(textInput);
  console.log("Response from Gemini: ", result.response);
  console.log("Response from Gemini: ", result.response.text());
  console.log("Response from Gemini: ", result.response.functionCalls());

  const functionCalls = result.response.functionCalls();

  if(functionCalls && functionCalls.length > 0) {
       const functionResponses = [];
         for(const functionCall of functionCalls){
           try{
              await jalankansemua(functionCall);
               functionResponses.push({
                  name: functionCall.name,
                  response: { status: 'success' }
               });

          }catch(error){
               functionResponses.push({
                  name: functionCall.name,
                  response: { status: 'failed', message: error.message }
               });
          }
      }
         const result2 = await chat.sendMessage(functionResponses.map(response => ({
              functionResponse: response
          })));

         console.log(result2.response.text())
  } else {
      console.log("No function call made from the model");
  }
}
async function perulangan(param) {
  let localStatus = false;
  try {
    await hasil(param);
    localStatus = true;
  } catch (error) {
    console.error("Error in perulangan:", error);
    localStatus = false;
  }
  return localStatus;
}
let status= true;
async function mainLoop() {
  while (true) {
    status = await perulangan(`video gambar tersebut apa?`);
    if (status) {
      console.log("Perulangan berhasil, menunggu 5 detik...");
    } else {
      console.log("Perulangan gagal, menunggu 5 detik...");
    }
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}
hasil('Beritahu saya apa yang ada di dalam video gambar tersebut?tolong jawab dengan text').catch(console.error);
