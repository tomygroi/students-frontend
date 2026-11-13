/**
    Trabajo: Consumir API con JavaScript - FrontEnd
    Alumno: Groizard Facundo Tomás
    Fecha: 05/11/26
    Curso: 7°3°
    */

const API_URL = "https://students-backend-1.onrender.com/api/students";

// Referencias al DOM
const tableBody = document.getElementById("students-table-body");
const messageBox = document.getElementById("message");
const studentForm = document.getElementById("student-form");
const btnSubmit = studentForm.querySelector('button[type="submit"]');
const btnCancel = document.getElementById("btn-cancel");

// Variable global para el modo (Crear = null, Editar = ID del estudiante)
let estudianteEnEdicionId = null;

// Función auxiliar para mostrar mensajes de éxito o error
function mostrarMensaje(mensaje, esError = false) {
    messageBox.textContent = mensaje;
    messageBox.className = `message ${esError ? "error" : "success"}`;
    messageBox.classList.remove("hidden");

    setTimeout(() => {
        messageBox.classList.add("hidden");
    }, 4000);
}

// Actividad 2: Listar estudiantes (GET)
async function cargarEstudiantes() {
    try {
        const response = await fetch(API_URL);

        // Actividad 6: Comprobar response.ok antes de leer el JSON
        if (!response.ok) {
            throw new Error(`Error de servidor (${response.status})`);
        }

        const estudiantes = await response.json();
        tableBody.innerHTML = "";

        if (estudiantes.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: #64748b; font-weight: bold;">
                        No hay estudiantes registrados.
                    </td>
                </tr>
            `;
            return;
        }

        estudiantes.forEach((estudiante) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td>${estudiante.id}</td>
                <td>${estudiante.firstName || estudiante.nombre}</td>
                <td>${estudiante.lastName || estudiante.apellido}</td>
                <td>${estudiante.email}</td>
                <td>${estudiante.age || estudiante.edad}</td>
                <td>
                    <button class="btn btn-edit" onclick="prepararEdicion(${estudiante.id})">Editar</button>
                    <button class="btn btn-delete" onclick="eliminarEstudiante(${estudiante.id})">Eliminar</button>
                </td>
            `;

            tableBody.appendChild(tr);
        });

    } catch (error) {
        // Actividad 6: Capturar fallos de red / API apagada (TypeError)
        if (error instanceof TypeError) {
            mostrarMensaje("No se pudo conectar con el servidor", true);
        } else {
            mostrarMensaje("Error al obtener estudiantes: " + error.message, true);
        }
    }
}

// Actividad 4a & 6: Cargar estudiante por ID (GET) con manejo de 404
async function prepararEdicion(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`);

        // Actividad 6: Tratar el 404 si el estudiante fue eliminado en otro cliente
        if (response.status === 404) {
            mostrarMensaje("El estudiante que intentas editar ya no existe", true);
            cargarEstudiantes();
            return;
        }

        if (!response.ok) {
            throw new Error(`Error ${response.status}`);
        }

        const estudiante = await response.json();

        document.getElementById("firstName").value = estudiante.firstName || estudiante.nombre || "";
        document.getElementById("lastName").value = estudiante.lastName || estudiante.apellido || "";
        document.getElementById("email").value = estudiante.email || "";
        document.getElementById("age").value = estudiante.age || estudiante.edad || "";

        estudianteEnEdicionId = id;
        btnSubmit.textContent = "Actualizar";
        btnSubmit.classList.add("btn-update");

        studentForm.scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        if (error instanceof TypeError) {
            mostrarMensaje("No se pudo conectar con el servidor", true);
        } else {
            mostrarMensaje("Error al obtener los datos: " + error.message, true);
        }
    }
}

// Actividad 3, 4b & 6: Guardar (POST) o Actualizar (PUT) mediante Submit
studentForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const estudianteData = {
        firstName: document.getElementById("firstName").value.trim(),
        lastName: document.getElementById("lastName").value.trim(),
        email: document.getElementById("email").value.trim(),
        age: parseInt(document.getElementById("age").value, 10)
    };

    const esEdicion = estudianteEnEdicionId !== null;
    const url = esEdicion ? `${API_URL}/${estudianteEnEdicionId}` : API_URL;
    const method = esEdicion ? "PUT" : "POST";

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(estudianteData)
        });

        // Actividad 6: Tratar el 404 si el registro a actualizar ya no existe
        if (response.status === 404 && esEdicion) {
            mostrarMensaje("No se pudo actualizar: el estudiante ya no existe", true);
            resetearFormulario();
            cargarEstudiantes();
            return;
        }

        // Actividad 6: Tratar errores de validación 400 antes de lanzar excepciones generales
        if (response.status === 400) {
            const data = await response.json().catch(() => null);
            if (data && data.errors && Array.isArray(data.errors)) {
                mostrarMensaje("Errores: " + data.errors.join(", "), true);
            } else if (data && data.message) {
                mostrarMensaje("Error: " + data.message, true);
            } else {
                mostrarMensaje("Datos del formulario inválidos (Error 400).", true);
            }
            return;
        }

        // Actividad 6: Comprobar response.ok antes de leer la respuesta exitosa
        if (response.ok) {
            resetearFormulario();
            mostrarMensaje(esEdicion ? "Estudiante actualizado con éxito" : "Estudiante creado con éxito", false);
            cargarEstudiantes();
            return;
        }

        throw new Error(`Error inesperado (${response.status})`);

    } catch (error) {
        if (error instanceof TypeError) {
            mostrarMensaje("No se pudo conectar con el servidor", true);
        } else {
            mostrarMensaje("Error al procesar la solicitud: " + error.message, true);
        }
    }
});

// Actividad 5 & 6: Eliminar un estudiante (DELETE) con tratamiento de 404
async function eliminarEstudiante(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar este estudiante?")) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: "DELETE"
        });

        // Actividad 6: Tratar el 404 si ya había sido eliminado
        if (response.status === 404) {
            mostrarMensaje("El estudiante que intentas eliminar ya no existe", true);
            cargarEstudiantes();
            return;
        }

        if (response.ok) {
            mostrarMensaje("Estudiante eliminado con éxito", false);
            cargarEstudiantes();
        } else {
            throw new Error(`Error ${response.status}`);
        }
    } catch (error) {
        if (error instanceof TypeError) {
            mostrarMensaje("No se pudo conectar con el servidor", true);
        } else {
            mostrarMensaje("No se pudo eliminar el estudiante: " + error.message, true);
        }
    }
}

// Resetear el formulario al estado original (Modo Crear)
function resetearFormulario() {
    studentForm.reset();
    estudianteEnEdicionId = null;
    btnSubmit.textContent = "Guardar";
    btnSubmit.classList.remove("btn-update");
}

// Evento Cancelar
btnCancel.addEventListener("click", () => {
    resetearFormulario();
});

// Inicializar al cargar la página
document.addEventListener("DOMContentLoaded", cargarEstudiantes);
