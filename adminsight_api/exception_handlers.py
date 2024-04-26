from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_response_data = {
            'error_code': response.data.get('detail').code,
            'error_message': response.data.get('detail')
        }
        response.data = custom_response_data

    return response
