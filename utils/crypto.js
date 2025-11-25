//crypto.js
function cifrarVigenere(texto, clave) {
    let resultado = '';
    const claveRepetida = clave.repeat(Math.ceil(texto.length / clave.length)).slice(0, texto.length);

    for (let i = 0; i < texto.length; i++) {
        const charCodeTexto = texto.charCodeAt(i);
        const charCodeClave = claveRepetida.charCodeAt(i % clave.length);
        const cifrado = (charCodeTexto + charCodeClave) % 256;
        resultado += String.fromCharCode(cifrado);
    }

    // 🔹 Convertimos a Base64 para guardarlo como texto seguro
    return Buffer.from(resultado, 'binary').toString('base64');
}

function descifrarVigenere(textoCifradoBase64, clave) {
    // 🔹 Primero decodificamos Base64 a texto original cifrado
    const textoCifrado = Buffer.from(textoCifradoBase64, 'base64').toString('binary');
    let resultado = '';
    const claveRepetida = clave.repeat(Math.ceil(textoCifrado.length / clave.length)).slice(0, textoCifrado.length);

    for (let i = 0; i < textoCifrado.length; i++) {
        const charCodeCifrado = textoCifrado.charCodeAt(i);
        const charCodeClave = claveRepetida.charCodeAt(i % clave.length);
        const descifrado = (charCodeCifrado - charCodeClave + 256) % 256;
        resultado += String.fromCharCode(descifrado);
    }

    return resultado;
}

module.exports = { cifrarVigenere, descifrarVigenere };
