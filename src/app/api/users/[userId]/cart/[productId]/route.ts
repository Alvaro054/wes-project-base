import { Types } from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'
import {
  ErrorResponse,
  GetCartResponse,
  addProductToCart,
  removeProductFromCart,
} from '@/lib/handlers'

export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string; productId: string } }
): Promise<NextResponse<GetCartResponse> | NextResponse<ErrorResponse>> {
  if (!Types.ObjectId.isValid(params.userId)) {
    return NextResponse.json(
      {
        error: 'WRONG_PARAMS',
        message: 'Invalid user ID.',
      },
      { status: 400 }
    )
  }

  if (!Types.ObjectId.isValid(params.productId)) {
    return NextResponse.json(
      {
        error: 'WRONG_PARAMS',
        message: 'Invalid product ID.',
      },
      { status: 400 }
    )
  }

  const body = await request.json()

  if (
    !body.qty ||
    typeof body.qty !== 'number' ||
    !Number.isInteger(body.qty) ||
    body.qty < 1
  ) {
    return NextResponse.json(
      {
        error: 'WRONG_PARAMS',
        message: 'qty must be an integer greater than or equal to 1.',
      },
      { status: 400 }
    )
  }

  const cart = await addProductToCart(
    params.userId,
    params.productId,
    body.qty
  )

  if (cart === null) {
    return NextResponse.json(
      {
        error: 'NOT_FOUND',
        message: 'User or product not found.',
      },
      { status: 404 }
    )
  }

  if (cart.created) {
    const headers = new Headers()
    headers.append(
      'Location',
      `/api/users/${params.userId}/cart/${params.productId}`
    )
    return NextResponse.json(
      { cartItems: cart.cartItems },
      { status: 201, headers: headers }
    )
  }

  return NextResponse.json({ cartItems: cart.cartItems })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; productId: string } }
): Promise<NextResponse<GetCartResponse> | NextResponse<ErrorResponse>> {
  if (!Types.ObjectId.isValid(params.userId)) {
    return NextResponse.json(
      {
        error: 'WRONG_PARAMS',
        message: 'Invalid user ID.',
      },
      { status: 400 }
    )
  }

  if (!Types.ObjectId.isValid(params.productId)) {
    return NextResponse.json(
      {
        error: 'WRONG_PARAMS',
        message: 'Invalid product ID.',
      },
      { status: 400 }
    )
  }

  const cart = await removeProductFromCart(params.userId, params.productId)

  if (cart === null) {
    return NextResponse.json(
      {
        error: 'NOT_FOUND',
        message: 'User or product not found.',
      },
      { status: 404 }
    )
  }

  return NextResponse.json(cart)
}