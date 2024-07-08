const { test, after, beforeEach, describe } = require('node:test')
const assert = require('node:assert')

const mongoose = require('mongoose')
const supertest = require('supertest')

const Blog = require('../models/blog')
const helper = require('./test_helper')
const app = require('../app')

const api = supertest(app)

const initialBlogs = [
    {
        title: 'blog 1',
        author: 'author 1',
        url: 'blog1.com',
        likes: 3
    }, {
        title: 'blog 2',
        author: 'author 2',
        url: 'blog2.com',
        likes: 5
    }
]

beforeEach(async () => {
    await Blog.deleteMany({})

    let blog = new Blog(initialBlogs[0])
    await blog.save()
    blog = new Blog(initialBlogs[1])
    await blog.save()
})

test('blogs are returned as json', async () => {
    await api
        .get('/api/blogs')
        .expect(200)
        .expect('Content-Type', /application\/json/)
})

test('unique identifier is named id', async () => {
    const response = await api.get('/api/blogs')
    const blogs = response.body

    assert(blogs[0].id)
})


describe('addition of new blog', () => {
    test('suceeds with valid data', async () => {
        const newBlog = {
            title: 'blog 3',
            author: 'author 3',
            url: 'blog3.com',
            likes: 1
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const response = await api.get('/api/blogs')

        assert.strictEqual(response.body.length, initialBlogs.length + 1)
    })

    test('fails with status code 400 if data invalid', async () => {
        const newBlog = {
            title: 'blog 4'
        }

        await api
            .post('/api/blogs')
            .send(newBlog)
            .expect(400)

        const response = await api.get('/api/blogs')

        assert.strictEqual(response.body.length, initialBlogs.length)
    })
})

describe('deletion of blog', () => {
    test('succeeds with status code 204 if id is valid', async () => {
        const blogsAtStart = await helper.blogsInDb()
        const blogToDelete = blogsAtStart[0]

        await api
            .delete(`/api/blogs/${blogToDelete.id}`)
            .expect(204)

        const blogsAtEnd = await helper.blogsInDb()

        assert.strictEqual(blogsAtEnd.length, initialBlogs.length - 1)
    })
})

describe('modification of blog', () => {
    test('suceeds with status code 200', async () => {
        const blogsInDb = await helper.blogsInDb()
        const blogToUpdate = blogsInDb[0]

        await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send({ likes: 100 })

        const response = await api.get('/api/blogs')

        assert.strictEqual(response.body[0].likes, 100)
    })
})

after(async () => {
    await mongoose.connection.close()
})