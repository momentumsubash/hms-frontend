describe('Rooms Page Debug', () => {
  const uniqueId = Date.now()
  const roomNum = `0001${uniqueId.toString().slice(-4)}`

  before(() => {
    cy.login()
    cy.window().then(win => {
      if (!win.localStorage.getItem('hotel')) {
        const token = win.localStorage.getItem('token')
        return cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/hotels/me`,
          headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
          if (res.body?.data) {
            win.localStorage.setItem('hotel', JSON.stringify(res.body.data))
          }
        })
      }
    })
  })

  it('should create and verify', () => {
    cy.window().then(win => {
      const token = win.localStorage.getItem('token')
      const hotel = JSON.parse(win.localStorage.getItem('hotel') || '{}')
      return cy.request({
        method: 'POST',
        url: `${Cypress.env('apiUrl')}/api/rooms`,
        headers: { Authorization: `Bearer ${token}` },
        body: { roomNumber: roomNum, type: 'single', rate: 2000, hotel: hotel._id }
      })
    }).then(resp => {
      expect(resp.status).to.eq(201)
      // Now search for the room via API
      return cy.window().then(win => {
        const token = win.localStorage.getItem('token')
        return cy.request({
          method: 'GET',
          url: `${Cypress.env('apiUrl')}/api/rooms?roomNumber=${roomNum}`,
          headers: { Authorization: `Bearer ${token}` }
        })
      })
    }).then(searchResp => {
      cy.log('Search results:', JSON.stringify(searchResp.body).slice(0,200))
      expect(searchResp.body.data).to.have.length(1)
      expect(searchResp.body.data[0].roomNumber).to.eq(roomNum)
    })
  })
})
