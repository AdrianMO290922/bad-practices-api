import { Elysia, status, t } from "elysia";
import { minLength, z } from "zod";

// Generación de datos simulados
const bankUsers = [];

const firstNames = ["Juan", "Maria", "Pedro", "Ana", "Luis", "Sofia", "Carlos", "Elena"];
const lastNames = ["Garcia", "Rodriguez", "Hernandez", "Lopez", "Martinez", "Gonzalez", "Perez"];
const addresses = ["Av. Reforma", "Calle 5 de Mayo", "Insurgentes Sur", "Av. Juarez", "Calle Madero"];
//validacion de salida
const userResponse = z.object({
  id: z.number(),
  name: z.string(),
  balance: z.number(),
  //address: z.string(),
  
});
function generateRandomUser(id: number) {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const address = `${addresses[Math.floor(Math.random() * addresses.length)]} #${Math.floor(Math.random() * 1000)}`;
  
  return {
    id,
    name: `${firstName} ${lastName}`,
    balance: Math.floor(Math.random() * 1000000) / 100,
    address,
    curp: `CURP${id}${Date.now().toString().slice(-4)}`,
    rfc: `RFC${id}${Date.now().toString().slice(-4)}`,
    password: `pass${Math.floor(Math.random() * 10000)}`, 
  };
}

for (let i = 1; i <= 100; i++) {
  bankUsers.push(generateRandomUser(i));
}

// TODO: Resolver malas prácticas de seguridad
const app = new Elysia()
  .get("/users", () => {
    return bankUsers.map(user => userResponse.parse(user));
  })
    
  .get("/users/:id", ({ params: { id }, error }) => {
    const user = bankUsers.find((u) => u.id == id);
    //Validacion de existencia
    if (!user){
      console.error(`User with id ${id} not found`);
      return status(404, { status: 404,message: `User with id ${id} not found` });
    }
    const userValidated = userResponse.parse(user);
        return userValidated;
  },
  //vALIDACION DE QUE SEA NUMERICO
  {params: t.Object({ id: t.Number() })
})
  .post("/users", ({ body, error }) => {
    const newUser = {
      ...body,
      id: bankUsers.length + 1
    };
    bankUsers.push(newUser);
    const newUserValidated = userResponse.parse(newUser);
    return  newUserValidated;
  },
  //validacion del body de entrada
  {body:t.Object({
    name: t.String(),
    balance: t.Number(),
    address: t.String(),
    curp: t.String(),
    rfc: t.String(),
    password: t.String(),

  })
})
  .put("/users/:id", ({ params: { id }, body, error }) => {
    const index = bankUsers.findIndex((u) => u.id == id);
    if (index === -1) {
      console.error(`User with id ${id} not found`);
      return status(404, { status: 404,message: `User with id ${id} not found` });
    }
    const updatedUser = { ...bankUsers[index], ...body };
    bankUsers[index] = updatedUser;
    const response = userResponse.parse(updatedUser);
    response.message = `User with id ${id} updated successfully`;
    return response;
  },{
    //Validacion de parametro y de campos opcionales de actualizacion y
    params: t.Object({ id: t.Number() }),
    body: t.Object({
      name:t.Optional(t.String({minLength: 1})),
      balance:t.Optional(t.Number({minimum: 0})),
      address:t.Optional(t.String()),
      curp:t.Optional(t.String()),
      rfc:t.Optional(t.String()),
      password:t.Optional(t.String({minLength: 8})),
    })
  }
  
)
  .delete("/users/:id", ({ params: { id }, error }) => {
    const index = bankUsers.findIndex((u) => u.id == id);
    if (index === -1) {
      console.error(`User with id ${id} not found`);
      return status(404, { status: 404,message: `User with id ${id} not found` });
    }
    const deletedUser = bankUsers.splice(index, 1);
    const response =userResponse.parse(deletedUser[0]);
    response.message = `User with id ${id} deleted successfully`;
    return response;
  },
  {params: t.Object({ id: t.Number() })}

)
  .post("/login", ({ body, error }) => {
    const { curp, password } = body;
    const user = bankUsers.find((u) => u.curp == curp && u.password == password);
    if (!user) {
      console.error(`Invalid credentials for CURP ${curp} or pass`);
      return status(401, { status: 401,message: `Invalid credentials for CURP ${curp} or password ${password}` });
    }
    return userResponse.parse(user);
  },
  {body: t.Object({
    curp: t.String({minLength: 18}),
    password: t.String({minLength: 8}),
  }),
  response: t.Object({
    id: t.Number(),
    name: t.String()
  })
})
  .listen(3000);




console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
