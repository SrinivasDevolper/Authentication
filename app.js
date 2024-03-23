const express = require('express')
const app = express()
app.use(express.json())
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbpath = path.join(__dirname, 'userData.db')
const bcrypt = require('bcrypt')
const initalizationdb = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server is working http://loalhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initalizationdb()
app.post('/register/', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const selectUserQuery = `
    SELECT
    *
    FROM
    user
    WHERE username= '${username}';
  `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const createUserQuary = `
            INSERT INTO
            user(username, name, password, gender, location)
            values(
              '${username}',
              '${name}',
              '${hashedPassword}',
              '${gender}',
              '${location}'
            )
        `
      await db.run(createUserQuary)
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body

  const selectUserQuery = `
      SELECT 
      *
      FROM
      user
      WHERE username='${username}';
  `
  const dbUser = await db.get(selectUserQuery)
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

app.put('/change-password/', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const selectUserData = `
      SELECT *
      FROM
      user
      WHERE username='${username}'
    `
  const dbUser = await db.get(selectUserData)
  if (dbUser === undefined) {
    response.status(400)
    response.send('User not registered')
  } else {
    const isValidPassword = await bcrypt.compare(oldPassword, dbUser.password)
    if (isValidPassword === true) {
      if (newPassword.length < 5) {
        response.status(400)
        response.send('Password is too short')
      } else {
        const encryptedPassword = await bcrypt.hash(newPassword, 10)
        const updatedOldUserPassword = `
              UPDATE user
              set password='${encryptedPassword}'
              where username='${username}'
          `
        await db.run(updatedOldUserPassword)
        response.status(200)
        response.send('Password updated')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})

module.exports = app
