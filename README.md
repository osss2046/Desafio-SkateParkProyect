# Descripción de Proyecto Skate Park

En este proyecto consiste en una proyecto FullStack en Node-Express que cuenta con un registro y un inicio de sesión, las claves se cifran en caracteres para proporcionar
mayor seguridad.
Además cada sesión en el proyecto cuenta con un token que autoriza a ingresar a las vistas de datos y admin, este token expira luego de 1 min.

El proyecto consiste en la creación de participantes mediante un registro, esta lista es 'la lista de participantes' skate park y se muestra en la raiz del proyecto.

Se permite registrar usuarios, eliminar usuarios, editar usuarios y por supuesto, ver usuarios. Además existe un campo booleano para la participación de skater, este se puede editar
en la vista de admin y puede ser aprobado o en revisión.

Finalmente el proyecto además del cliente-servidor anteriormente nombrado cuenta con una APIRest con CRUD completo, la cual se explicara en las instrucciones.

## Instrucciones para ejecutar el proyecto

Primero se debe instalar las dependencias usadas en el proyecto, esto se realiza ejecutando el comando:
```
npm install
```
Este proyecto cuenta no nodemon, por lo tanto para ejecutarlo en local, se debe realizar el comando:
```
npm run dev
```

El proyecto esta conectado a una base de datos, usando PostgreSQL, la configuración de su base de datos se debe realizar en el archivo:
```
/db.js
```
Además debe crear esta base de datos, para seguir con la configuración inicial, cree una base de datos con el siguiente nombre:
```
CREATE DATABASE skatepark;
```
Esta base de datos cuenta con una unica tabla llamada 'skaters' de la siguiente manera:
```
CREATE TABLE skaters
  (id SERIAL,
   email VARCHAR(50) NOT NULL,
   nombre VARCHAR(25) NOT NULL,
   password VARCHAR(25) NOT NULL,
   anos_experiencia INT NOT NULL,
   especialidad VARCHAR(50) NOT NULL,
   foto VARCHAR(255) NOT NULL,
   estado BOOLEAN NOT NULL);
```
Con esto, la configuración para ejecutar el proyecto ya esta lista.

## Rutas

El proyecto esta configurador para ejecutarse en el puerto 3000, por lo tanto el home es:
```
http://localhost:3000/
```
Además en todo momento en la pagina se presentan los botones para registrar o iniciar sesión. Una vez que se ha iniciado sesión se puede acceder a admin:
```
http://localhost:3000/admin
```
En esta pagina puede cambiar el estado de cada uno de los participantes. Además existe una pagina llamada datos y en esta se puede actualizar los atributos de un usuario o eliminarlo:
```
http://localhost:3000/datos
```

## APIREST

Finalmente, el proyecto cuenta con una APIREST y las rutas de esta API son las siguientes:
  - ver todos los participantes: Metodo Get en la ruta [http://localhost:3000//api/skaters](http://localhost:3000//api/skaters)
  - Registrar un participante: Metodo POST en la ruta [http://localhost:3000//api/skaters](http://localhost:3000//api/skaters)
  - Iniciar sesión : Metodo POST en la ruta [http://localhost:3000//api/login](http://localhost:3000//api/login)
  - Actualizar los datos de un participante : Metodo PUT en la ruta [http://localhost:3000//api/skaters/:id](http://localhost:3000//api/skaters/:id)
  - Eliminar un participante : Metodo DELETE en la ruta [http://localhost:3000//api/skaters/:id](http://localhost:3000//api/skaters/:id)
  
Para algunas funciones como eliminar o actualizar debe entregar el token generado al iniciar sesión en la cabecera de la solicitud.
